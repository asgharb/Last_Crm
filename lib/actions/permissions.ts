"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/db";
import { auth } from "@/lib/auth";
import { ACCESS_MODULES, getRolePermissions, type AccessModule, type RoleName } from "@/lib/permissions";

const moduleSchema = z.enum(ACCESS_MODULES.map(({ key }) => key) as [AccessModule, ...AccessModule[]]);

async function requireAdmin() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error("برای ادامه وارد پنل شوید.");
  if (session.user.role !== "admin") throw new Error("مدیر سیستم هستید؟ برای تغییر دسترسی‌ها فقط مدیر مجاز است.");
}

export async function listRolePermissions() {
  await requireAdmin();
  const [userPermissions, users] = await Promise.all([
    getRolePermissions("user"),
    db.user.groupBy({ by: ["role"], where: { isDeleted: false }, _count: { _all: true } }),
  ]);
  return {
    roles: [
      { role: "admin" as const, label: "مدیر", userCount: users.find((item) => item.role === "admin")?._count._all ?? 0, permissions: await getRolePermissions("admin") },
      { role: "user" as const, label: "کاربر", userCount: users.find((item) => item.role === "user")?._count._all ?? 0, permissions: userPermissions },
    ],
  };
}

export async function saveRolePermissions(input: unknown) {
  await requireAdmin();
  const parsed = z.object({
    role: z.literal("user"),
    permissions: z.record(moduleSchema, z.boolean()),
  }).refine(({ permissions }) => ACCESS_MODULES.every(({ key, adminOnly }) => !adminOnly || permissions[key] !== true), {
    message: "دسترسی به بخش‌های مدیریتی فقط برای نقش مدیر مجاز است.",
  }).parse(input);
  await db.$transaction(parsed.permissions && Object.entries(parsed.permissions).map(([module, allowed]) =>
    db.rolePermission.upsert({
      where: { role_module: { role: parsed.role, module } },
      update: { allowed },
      create: { role: parsed.role, module, allowed },
    }),
  ));
  revalidatePath("/role-permissions");
  revalidatePath("/", "layout");
  return { success: true };
}
