import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { auth } from "@/lib/auth";

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const MAX_FILES_PER_REQUEST = 20;

async function isAdmin() {
  const session = await auth.api.getSession({ headers: await headers() });
  return session?.user.role === "admin";
}

type Context = { params: Promise<{ customerId: string }> };

export async function GET(_request: Request, { params }: Context) {
  if (!(await isAdmin())) return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 401 });
  const { customerId } = await params;
  if (!z.string().uuid().safeParse(customerId).success) return NextResponse.json({ error: "مشتری نامعتبر است" }, { status: 400 });
  const customer = await db.customer.findFirst({ where: { id: customerId, isDeleted: false }, select: { id: true } });
  if (!customer) return NextResponse.json({ error: "مشتری پیدا نشد" }, { status: 404 });
  const documents = await db.customerDocument.findMany({
    where: { customerId }, orderBy: { createdAt: "desc" },
    select: { id: true, fileName: true, contentType: true, size: true, createdAt: true },
  });
  return NextResponse.json(documents);
}

export async function POST(request: Request, { params }: Context) {
  if (!(await isAdmin())) return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 401 });
  const { customerId } = await params;
  if (!z.string().uuid().safeParse(customerId).success) return NextResponse.json({ error: "مشتری نامعتبر است" }, { status: 400 });
  const customer = await db.customer.findFirst({ where: { id: customerId, isDeleted: false }, select: { id: true } });
  if (!customer) return NextResponse.json({ error: "مشتری پیدا نشد" }, { status: 404 });

  const form = await request.formData();
  const files = form.getAll("files").filter((entry): entry is File => entry instanceof File && entry.size > 0);
  if (!files.length || files.length > MAX_FILES_PER_REQUEST) {
    return NextResponse.json({ error: `یک تا ${MAX_FILES_PER_REQUEST} فایل انتخاب کنید` }, { status: 400 });
  }
  if (files.some((file) => file.size > MAX_FILE_SIZE || !file.name || file.name.length > 255)) {
    return NextResponse.json({ error: "حداکثر حجم هر فایل ۱۰ مگابایت است" }, { status: 400 });
  }

  await db.customerDocument.createMany({ data: await Promise.all(files.map(async (file) => ({
    customerId,
    fileName: file.name.replace(/[\\/\r\n\0]/g, "_").slice(0, 255),
    contentType: file.type.slice(0, 150) || "application/octet-stream",
    size: file.size,
    content: Buffer.from(await file.arrayBuffer()),
  }))) });
  return NextResponse.json({ success: true });
}
