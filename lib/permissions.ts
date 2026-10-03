import "server-only";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { ACCESS_MODULES, type AccessModule, type RoleName } from "@/lib/access-modules";
export { ACCESS_MODULES } from "@/lib/access-modules";
export type { AccessModule, RoleName } from "@/lib/access-modules";

export async function requirePermission(module: AccessModule) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error("برای ادامه وارد پنل شوید.");
  if (session.user.role === "admin") return session;
  if (ACCESS_MODULES.find(({ key }) => key === module)?.adminOnly) throw new Error("این بخش فقط برای مدیر سیستم قابل دسترسی است.");
  const permission = await db.rolePermission.findUnique({
    where: { role_module: { role: session.user.role ?? "user", module } },
    select: { allowed: true },
  });
  if (!permission?.allowed) throw new Error("شما به این بخش دسترسی ندارید.");
  return session;
}

export async function requireAnyPermission(modules: AccessModule[]) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error("برای ادامه وارد پنل شوید.");
  if (session.user.role === "admin") return session;
  const permissions = await db.rolePermission.findMany({
    where: { role: session.user.role ?? "user", module: { in: modules }, allowed: true },
    select: { module: true },
  });
  if (!permissions.length) throw new Error("شما به این بخش دسترسی ندارید.");
  return session;
}

export async function hasPermission(role: string, module: AccessModule) {
  if (role === "admin") return true;
  if (ACCESS_MODULES.find(({ key }) => key === module)?.adminOnly) return false;
  const permission = await db.rolePermission.findUnique({
    where: { role_module: { role, module } }, select: { allowed: true },
  });
  return permission?.allowed ?? false;
}

export async function getRolePermissions(role: RoleName): Promise<Record<AccessModule, boolean>> {
  const permissions = Object.fromEntries(ACCESS_MODULES.map(({ key }) => [key, role === "admin"]));
  if (role !== "admin") {
    const saved = await db.rolePermission.findMany({ where: { role } });
    for (const permission of saved) {
      if (ACCESS_MODULES.some(({ key }) => key === permission.module)) {
        const module = ACCESS_MODULES.find(({ key }) => key === permission.module);
        permissions[permission.module as AccessModule] = module?.adminOnly ? false : permission.allowed;
      }
    }
  }
  return permissions as Record<AccessModule, boolean>;
}

export async function getAccessibleModules(role: string): Promise<AccessModule[]> {
  if (role === "admin") return ACCESS_MODULES.map(({ key }) => key);
  const permissions = await getRolePermissions("user");
  return ACCESS_MODULES.filter(({ key }) => permissions[key]).map(({ key }) => key);
}
