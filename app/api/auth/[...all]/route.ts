import { toNextJsHandler } from "better-auth/next-js";
import { auth } from "@/lib/auth";
import { db } from "@/db";

const handler = toNextJsHandler(auth);
export const GET = handler.GET;

export async function POST(request: Request) {
  const isUsernameSignIn = new URL(request.url).pathname.endsWith("/sign-in/username");
  if (!isUsernameSignIn) return handler.POST(request);

  const body = await request.clone().json().catch(() => null) as { username?: string } | null;
  const username = body?.username?.trim().toLowerCase();
  const user = username
    ? await db.user.findUnique({ where: { username } })
    : null;

  if (user && (!user.isActive || user.isDeleted || user.banned)) {
    return Response.json({
      code: "ACCOUNT_DISABLED",
      message: "حساب کاربری غیرفعال است. با مدیر سیستم تماس بگیرید.",
    }, { status: 403 });
  }

  const response = await handler.POST(request);
  if (!user) return response;

  if (response.ok) {
    if (user.failedLoginAttempts) {
      await db.user.update({
        where: { id: user.id },
        data: { failedLoginAttempts: 0, lastFailedLoginAt: null },
      });
    }
    return response;
  }

  const updated = await db.user.update({
    where: { id: user.id },
    data: {
      failedLoginAttempts: { increment: 1 },
      lastFailedLoginAt: new Date(),
    },
    select: { failedLoginAttempts: true },
  });

  if (updated.failedLoginAttempts >= 5) {
    await db.$transaction([
      db.user.update({
        where: { id: user.id },
        data: {
          isActive: false,
          banned: true,
          banReason: "Account disabled after five failed login attempts",
        },
      }),
      db.session.deleteMany({ where: { userId: user.id } }),
    ]);
    return Response.json({
      code: "ACCOUNT_DISABLED",
      message: "حساب کاربری پس از پنج ورود ناموفق غیرفعال شد.",
    }, { status: 403 });
  }

  return response;
}

export const runtime = "nodejs";
