"use server";

import { headers } from "next/headers";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/db";

export async function changeOwnPassword(input: unknown) {
  const parsed = z.object({
    currentPassword: z.string().min(1, "گذرواژه فعلی را وارد کنید."),
    newPassword: z.string().min(12, "گذرواژه جدید باید حداقل ۱۲ نویسه باشد."),
    confirmPassword: z.string().min(1),
  }).refine((value) => value.newPassword === value.confirmPassword, {
    message: "تکرار گذرواژه با گذرواژه جدید یکسان نیست.",
    path: ["confirmPassword"],
  }).parse(input);

  const requestHeaders = await headers();
  const session = await auth.api.getSession({ headers: requestHeaders });
  if (!session) throw new Error("نشست شما منقضی شده است. دوباره وارد شوید.");

  await auth.api.changePassword({
    headers: requestHeaders,
    body: {
      currentPassword: parsed.currentPassword,
      newPassword: parsed.newPassword,
      revokeOtherSessions: true,
    },
  });
  await db.user.update({
    where: { id: session.user.id },
    data: { failedLoginAttempts: 0, lastFailedLoginAt: null },
  });
  return { success: true };
}
