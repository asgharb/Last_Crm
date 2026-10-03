"use server";

import { Buffer } from "node:buffer";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { THEME_COLORS, THEME_MODES } from "@/lib/organization-settings";

const MAX_LOGO_SIZE = 1024 * 1024;
const ALLOWED_LOGO_TYPES = new Set(["image/png", "image/jpeg", "image/webp"]);

async function requireAdmin() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || session.user.role !== "admin") throw new Error("دسترسی مدیر سیستم لازم است.");
}

export async function updateOrganizationSettings(formData: FormData) {
  await requireAdmin();
  const parsed = z.object({
    organizationName: z.string().trim().min(2, "نام سازمان حداقل دو نویسه باشد.").max(160),
    themeMode: z.enum(THEME_MODES),
    themeColor: z.enum(THEME_COLORS),
    removeLogo: z.boolean(),
  }).parse({
    organizationName: formData.get("organizationName"),
    themeMode: formData.get("themeMode"),
    themeColor: formData.get("themeColor"),
    removeLogo: formData.get("removeLogo") === "true",
  });

  const logo = formData.get("logo");
  let logoData: string | null | undefined;
  if (parsed.removeLogo) logoData = null;
  if (logo instanceof File && logo.size > 0) {
    if (logo.size > MAX_LOGO_SIZE) throw new Error("حجم لوگو حداکثر یک مگابایت باشد.");
    if (!ALLOWED_LOGO_TYPES.has(logo.type)) throw new Error("فرمت لوگو باید PNG، JPEG یا WebP باشد.");
    logoData = `data:${logo.type};base64,${Buffer.from(await logo.arrayBuffer()).toString("base64")}`;
  }

  await db.organizationSetting.upsert({
    where: { id: "default" },
    create: {
      id: "default",
      organizationName: parsed.organizationName,
      themeMode: parsed.themeMode,
      themeColor: parsed.themeColor,
      ...(logoData !== undefined ? { logoData } : {}),
    },
    update: {
      organizationName: parsed.organizationName,
      themeMode: parsed.themeMode,
      themeColor: parsed.themeColor,
      ...(logoData !== undefined ? { logoData } : {}),
    },
  });
  revalidatePath("/", "layout");
  return { success: true };
}
