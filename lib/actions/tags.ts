"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/db";
import { auth } from "@/lib/auth";
import { requirePermission, requireAnyPermission } from "@/lib/permissions";
const tagInput = z.object({
  name: z.string().trim().min(1, "Ù†Ø§Ù… ØªÚ¯ Ø±Ø§ ÙˆØ§Ø±Ø¯ Ú©Ù†ÛŒØ¯.").max(60),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Ø±Ù†Ú¯ Ù…Ø¹ØªØ¨Ø± Ø§Ù†ØªØ®Ø§Ø¨ Ú©Ù†ÛŒØ¯."),
});

async function requireAdmin() {
  await requirePermission("tags");
}

function revalidateTagPages() {
  revalidatePath("/tags");
  revalidatePath("/customers");
}

export async function listTags() {
  await requireAnyPermission(["tags", "customers"]);
  return db.tag.findMany({
    where: { isDeleted: false },
    orderBy: { name: "asc" },
    include: { _count: { select: { customers: true } } },
  });
}

export async function createTag(input: unknown) {
  await requireAdmin();
  const parsed = tagInput.parse(input);
  try {
    const existing = await db.tag.findUnique({ where: { name: parsed.name } });
    const tag = existing
      ? existing.isDeleted
        ? await db.tag.update({
            where: { id: existing.id },
            data: { ...parsed, isDeleted: false, deletedAt: null },
          })
        : (() => { throw new Error("ØªÚ¯ÛŒ Ø¨Ø§ Ø§ÛŒÙ† Ù†Ø§Ù… Ø§Ø² Ù‚Ø¨Ù„ ÙˆØ¬ÙˆØ¯ Ø¯Ø§Ø±Ø¯."); })()
      : await db.tag.create({ data: parsed });
    revalidateTagPages();
    return { id: tag.id };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new Error("ØªÚ¯ÛŒ Ø¨Ø§ Ø§ÛŒÙ† Ù†Ø§Ù… Ø§Ø² Ù‚Ø¨Ù„ ÙˆØ¬ÙˆØ¯ Ø¯Ø§Ø±Ø¯.");
    }
    throw error;
  }
}

export async function updateTag(id: string, input: unknown) {
  await requireAdmin();
  const tagId = z.string().uuid().parse(id);
  const parsed = tagInput.parse(input);
  try {
    await db.tag.update({ where: { id: tagId, isDeleted: false }, data: parsed });
    revalidateTagPages();
    return { success: true };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new Error("ØªÚ¯ÛŒ Ø¨Ø§ Ø§ÛŒÙ† Ù†Ø§Ù… Ø§Ø² Ù‚Ø¨Ù„ ÙˆØ¬ÙˆØ¯ Ø¯Ø§Ø±Ø¯.");
    }
    throw error;
  }
}

export async function softDeleteTag(id: string) {
  await requireAdmin();
  const tagId = z.string().uuid().parse(id);
  const result = await db.$transaction(async (tx) => {
    await tx.customerTag.deleteMany({ where: { tagId } });
    return tx.tag.updateMany({
      where: { id: tagId, isDeleted: false },
      data: { isDeleted: true, deletedAt: new Date() },
    });
  });
  if (!result.count) throw new Error("ØªÚ¯ Ù¾ÛŒØ¯Ø§ Ù†Ø´Ø¯.");
  revalidateTagPages();
  return { success: true };
}
