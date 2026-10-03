"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/db";
import { auth } from "@/lib/auth";
import { requirePermission } from "@/lib/permissions";
const templateInput = z.object({
  name: z.string().trim().min(1, "Ù†Ø§Ù… Ù‚Ø§Ù„Ø¨ Ø±Ø§ ÙˆØ§Ø±Ø¯ Ú©Ù†ÛŒØ¯.").max(100),
  content: z.string().trim().min(1, "Ù…ØªÙ† Ù¾ÛŒØ§Ù…Ú© Ø±Ø§ ÙˆØ§Ø±Ø¯ Ú©Ù†ÛŒØ¯.").max(4000),
  isActive: z.boolean().default(true),
});

async function requireAdmin() {
  await requirePermission("smsTemplates");
}

async function resolvePlaceholderIds(content: string) {
  const tokens = [...new Set([...content.matchAll(/\(\((.+?)\)\)/gu)].map(([token]) => token))];
  if (!tokens.length) return [];

  const placeholders = await db.smsPlaceholder.findMany({
    where: { token: { in: tokens }, isDeleted: false },
    select: { id: true, token: true },
  });
  const knownTokens = new Set(placeholders.map(({ token }) => token));
  const unknownTokens = tokens.filter((token) => !knownTokens.has(token));
  if (unknownTokens.length) {
    throw new Error(`Ú©Ù„ÛŒØ¯ÙˆØ§Ú˜Ù‡ Ø±Ø²Ø±ÙˆØ´Ø¯Ù‡ Ù…Ø¹ØªØ¨Ø± Ù†ÛŒØ³Øª: ${unknownTokens.join("ØŒ ")}`);
  }
  return placeholders.map(({ id }) => id);
}

function refreshSmsTemplates() {
  revalidatePath("/sms-templates");
}

export async function listSmsTemplateData() {
  await requireAdmin();
  const [templates, placeholders] = await Promise.all([
    db.smsTemplate.findMany({
      where: { isDeleted: false },
      orderBy: [{ updatedAt: "desc" }, { name: "asc" }],
      include: {
        placeholders: {
          where: { placeholder: { is: { isDeleted: false } } },
          select: { placeholder: { select: { id: true, token: true, label: true } } },
        },
      },
    }),
    db.smsPlaceholder.findMany({
      where: { isDeleted: false },
      orderBy: { label: "asc" },
      select: { id: true, token: true, label: true, description: true, customerField: true },
    }),
  ]);
  return { templates, placeholders };
}

export async function createSmsTemplate(input: unknown) {
  await requireAdmin();
  const parsed = templateInput.parse(input);
  const placeholderIds = await resolvePlaceholderIds(parsed.content);
  const template = await db.$transaction(async (tx) => {
    const created = await tx.smsTemplate.create({ data: parsed });
    if (placeholderIds.length) {
      await tx.smsTemplatePlaceholder.createMany({
        data: placeholderIds.map((placeholderId) => ({ templateId: created.id, placeholderId })),
      });
    }
    return created;
  });
  refreshSmsTemplates();
  return { id: template.id };
}

export async function updateSmsTemplate(id: string, input: unknown) {
  await requireAdmin();
  const templateId = z.string().uuid().parse(id);
  const parsed = templateInput.parse(input);
  const placeholderIds = await resolvePlaceholderIds(parsed.content);
  await db.$transaction(async (tx) => {
    const existing = await tx.smsTemplate.findFirst({ where: { id: templateId, isDeleted: false }, select: { id: true } });
    if (!existing) throw new Error("Ù‚Ø§Ù„Ø¨ Ù¾ÛŒØ§Ù…Ú© Ù¾ÛŒØ¯Ø§ Ù†Ø´Ø¯.");
    await tx.smsTemplate.update({ where: { id: templateId }, data: parsed });
    await tx.smsTemplatePlaceholder.deleteMany({ where: { templateId } });
    if (placeholderIds.length) {
      await tx.smsTemplatePlaceholder.createMany({
        data: placeholderIds.map((placeholderId) => ({ templateId, placeholderId })),
      });
    }
  });
  refreshSmsTemplates();
  return { success: true };
}

export async function setSmsTemplateActive(id: string, isActive: boolean) {
  await requireAdmin();
  const templateId = z.string().uuid().parse(id);
  const result = await db.smsTemplate.updateMany({
    where: { id: templateId, isDeleted: false },
    data: { isActive },
  });
  if (!result.count) throw new Error("Ù‚Ø§Ù„Ø¨ Ù¾ÛŒØ§Ù…Ú© Ù¾ÛŒØ¯Ø§ Ù†Ø´Ø¯.");
  refreshSmsTemplates();
  return { success: true };
}

export async function softDeleteSmsTemplate(id: string) {
  await requireAdmin();
  const templateId = z.string().uuid().parse(id);
  const result = await db.smsTemplate.updateMany({
    where: { id: templateId, isDeleted: false },
    data: { isDeleted: true, deletedAt: new Date() },
  });
  if (!result.count) throw new Error("Ù‚Ø§Ù„Ø¨ Ù¾ÛŒØ§Ù…Ú© Ù¾ÛŒØ¯Ø§ Ù†Ø´Ø¯.");
  refreshSmsTemplates();
  return { success: true };
}
