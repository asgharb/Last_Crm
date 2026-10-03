import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { auth } from "@/lib/auth";

export const runtime = "nodejs";

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (session?.user.role !== "admin") return NextResponse.json({ error: "دسترسی مدیر لازم است." }, { status: 403 });

  const [users, sessions, accounts, verifications, customers, customerDocuments, tags, customerTags,
    smsTemplates, smsPlaceholders, smsTemplatePlaceholders, smsDeliveries, rolePermissions] = await Promise.all([
    db.user.findMany(), db.session.findMany(), db.account.findMany(), db.verification.findMany(),
    db.customer.findMany(), db.customerDocument.findMany(), db.tag.findMany(), db.customerTag.findMany(),
    db.smsTemplate.findMany(), db.smsPlaceholder.findMany(), db.smsTemplatePlaceholder.findMany(), db.smsDelivery.findMany(), db.rolePermission.findMany(),
  ]);

  const backup = {
    format: "rtl-admin-dashboard-backup",
    version: 1,
    createdAt: new Date().toISOString(),
    tables: { users, sessions, accounts, verifications, customers, customerDocuments, tags, customerTags,
    smsTemplates, smsPlaceholders, smsTemplatePlaceholders, smsDeliveries, rolePermissions },
  };
  const date = new Date().toISOString().slice(0, 10);
  return new Response(JSON.stringify(backup), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="dashboard-backup-${date}.json"`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
