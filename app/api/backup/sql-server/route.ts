import { randomUUID } from "node:crypto";
import { createReadStream } from "node:fs";
import { stat, unlink } from "node:fs/promises";
import path from "node:path";
import { Readable } from "node:stream";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { auth } from "@/lib/auth";

export const runtime = "nodejs";
export const maxDuration = 300;

async function removeFile(filePath: string) {
  await unlink(filePath).catch(() => undefined);
}

export async function POST() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (session?.user.role !== "admin") {
    return NextResponse.json({ error: "دسترسی مدیر لازم است." }, { status: 403 });
  }

  let backupPath: string | undefined;
  try {
    const [server] = await db.$queryRaw<{ databaseName: string }[]>`SELECT DB_NAME() AS databaseName`;
    const directory = process.env.SQLSERVER_BACKUP_DIR?.trim() || path.join(process.cwd(), "sql-backups");
    if (!server?.databaseName || !path.isAbsolute(directory) || directory.includes("\0")) {
      return NextResponse.json({
        error: "مسیر بکاپ SQL Server معتبر نیست. SQLSERVER_BACKUP_DIR را روی یک مسیر کامل و قابل‌دسترسی تنظیم کنید.",
      }, { status: 503 });
    }

    const date = new Date().toISOString().replace(/[-:TZ.]/g, "").slice(0, 14);
    const fileName = `dashboard-backup-${date}-${randomUUID()}.bak`;
    backupPath = path.join(directory, fileName);
    const quotedDatabase = `[${server.databaseName.replace(/]/g, "]]" )}]`;
    const quotedPath = backupPath.replace(/'/g, "''");

    await db.$executeRawUnsafe(
      `BACKUP DATABASE ${quotedDatabase} TO DISK = N'${quotedPath}' WITH COPY_ONLY, CHECKSUM, STATS = 10;`,
    );

    const fileStat = await stat(backupPath);
    const stream = createReadStream(backupPath);
    stream.once("close", () => { void removeFile(backupPath!); });
    stream.once("error", () => { void removeFile(backupPath!); });
    return new Response(Readable.toWeb(stream) as ReadableStream, {
      headers: {
        "Content-Type": "application/octet-stream",
        "Content-Disposition": `attachment; filename="${fileName}"`,
        "Content-Length": String(fileStat.size),
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    if (backupPath) await removeFile(backupPath);
    console.error("SQL Server backup failed:", error);
    return NextResponse.json({
      error: "ساخت یا دریافت فایل بکاپ ناموفق بود. مجوز BACKUP DATABASE و دسترسی نوشتن/خواندن مسیر بکاپ را بررسی کنید.",
    }, { status: 500 });
  }
}
