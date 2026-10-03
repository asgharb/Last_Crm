"use server";
import { randomUUID } from "node:crypto";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { requirePermission } from "@/lib/permissions";
import { db } from "@/db";
import { createUsersRepository } from "@/db/users-repository";

const repo = createUsersRepository(db);
const usernameSchema = z.string().trim().min(3, "Ù†Ø§Ù… Ú©Ø§Ø±Ø¨Ø±ÛŒ Ø¨Ø§ÛŒØ¯ Ø­Ø¯Ø§Ù‚Ù„ Û³ Ù†ÙˆÛŒØ³Ù‡ Ø¨Ø§Ø´Ø¯.").max(30)
  .regex(/^[\p{L}\p{N}_.-]+$/u, "Ù†Ø§Ù… Ú©Ø§Ø±Ø¨Ø±ÛŒ ÙÙ‚Ø· Ù…ÛŒâ€ŒØªÙˆØ§Ù†Ø¯ Ø´Ø§Ù…Ù„ Ø­Ø±ÙˆÙØŒ Ø¹Ø¯Ø¯ØŒ Ù†Ù‚Ø·Ù‡ØŒ Ø®Ø· ØªÛŒØ±Ù‡ Ùˆ Ø²ÛŒØ±Ø®Ø· Ø¨Ø§Ø´Ø¯.");
const userInput = z.object({ name: z.string().trim().min(2).max(120), username: usernameSchema, role: z.enum(["user", "admin"]), isActive: z.boolean().default(true) });
async function requireAdmin() {
  await requirePermission("users");
}
export async function listUsers() { await requireAdmin(); return repo.findMany(); }
export async function createUser(input: unknown) {
  await requireAdmin();
  const parsed = userInput.extend({ password: z.string().min(12) }).parse(input);
  const requestHeaders = await headers();
  const normalizedUsername = parsed.username.toLowerCase();
  const created = await auth.api.createUser({ headers: requestHeaders, body: { name: parsed.name, email: `${randomUUID()}@users.invalid`, password: parsed.password, role: parsed.role, data: { username: normalizedUsername, displayUsername: parsed.username } } });
  if (!parsed.isActive) {
    await auth.api.adminUpdateUser({ headers: requestHeaders, body: { userId: created.user.id, data: { isActive: false } } });
  }
  revalidatePath("/users"); return { id: created.user.id };
}
export async function updateUser(input: unknown) {
  await requireAdmin();
  const parsed = userInput.extend({ id: z.string().min(1).max(64) }).parse(input);
  await auth.api.adminUpdateUser({ headers: await headers(), body: { userId: parsed.id, data: { name: parsed.name, username: parsed.username.toLowerCase(), displayUsername: parsed.username, role: parsed.role, isActive: parsed.isActive } } });
  if (parsed.isActive) await auth.api.unbanUser({ headers: await headers(), body: { userId: parsed.id } });
  else await auth.api.banUser({ headers: await headers(), body: { userId: parsed.id, banReason: "Account disabled by administrator" } });
  await repo.update(parsed.id, { name: parsed.name, role: parsed.role, isActive: parsed.isActive });
  revalidatePath("/users"); return { success: true };
}
export async function setUserActive(id: string, isActive: boolean) {
  await requireAdmin(); const parsed = z.string().min(1).max(64).parse(id);
  if (isActive) await auth.api.unbanUser({ headers: await headers(), body: { userId: parsed } });
  else await auth.api.banUser({ headers: await headers(), body: { userId: parsed, banReason: "Account disabled by administrator" } });
  await repo.update(parsed, { isActive }); revalidatePath("/users"); return { success: true };
}
export async function softDeleteUser(id: string) {
  await requireAdmin(); const parsed = z.string().min(1).max(64).parse(id);
  await auth.api.banUser({ headers: await headers(), body: { userId: parsed, banReason: "Account removed by administrator" } });
  await repo.delete(parsed); revalidatePath("/users"); return { success: true };
}
