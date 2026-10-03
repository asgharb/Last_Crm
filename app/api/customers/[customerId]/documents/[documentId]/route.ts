import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { auth } from "@/lib/auth";

async function isAdmin() {
  const session = await auth.api.getSession({ headers: await headers() });
  return session?.user.role === "admin";
}

type Context = { params: Promise<{ customerId: string; documentId: string }> };

export async function GET(_request: Request, { params }: Context) {
  if (!(await isAdmin())) return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 401 });
  const { customerId, documentId } = await params;
  if (!z.string().uuid().safeParse(customerId).success || !z.string().uuid().safeParse(documentId).success) {
    return NextResponse.json({ error: "مدرک نامعتبر است" }, { status: 400 });
  }
  const document = await db.customerDocument.findFirst({ where: { id: documentId, customerId, customer: { isDeleted: false } } });
  if (!document) return NextResponse.json({ error: "مدرک پیدا نشد" }, { status: 404 });
  const safeName = document.fileName.replace(/[\r\n"\\]/g, "_");
  return new Response(Buffer.from(document.content), {
    headers: {
      "Content-Type": document.contentType,
      "Content-Length": String(document.size),
      "Content-Disposition": `attachment; filename="${safeName}"; filename*=UTF-8''${encodeURIComponent(document.fileName)}`,
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": "private, no-store",
    },
  });
}

export async function DELETE(_request: Request, { params }: Context) {
  if (!(await isAdmin())) return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 401 });
  const { customerId, documentId } = await params;
  if (!z.string().uuid().safeParse(customerId).success || !z.string().uuid().safeParse(documentId).success) {
    return NextResponse.json({ error: "مدرک نامعتبر است" }, { status: 400 });
  }
  const result = await db.customerDocument.deleteMany({ where: { id: documentId, customerId } });
  if (!result.count) return NextResponse.json({ error: "مدرک پیدا نشد" }, { status: 404 });
  return NextResponse.json({ success: true });
}
