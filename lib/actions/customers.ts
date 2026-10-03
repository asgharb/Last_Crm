"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/db";
import { auth } from "@/lib/auth";
import { requirePermission } from "@/lib/permissions";
function toEnglishDigits(value: string) {
  return value.replace(/[Û°-Û¹Ù -Ù©]/g, (digit) =>
    String("Û°Û±Û²Û³Û´ÛµÛ¶Û·Û¸Û¹Ù Ù¡Ù¢Ù£Ù¤Ù¥Ù¦Ù§Ù¨Ù©".indexOf(digit) % 10),
  );
}

function normalizeDateDigits(value: string) {
  return value.replace(/[0-9\u0660-\u0669\u06F0-\u06F9]/g, (digit) => {
    const code = digit.charCodeAt(0);
    if (code >= 0x0660 && code <= 0x0669) return String(code - 0x0660);
    if (code >= 0x06f0 && code <= 0x06f9) return String(code - 0x06f0);
    return digit;
  });
}

function isValidDateOnly(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return false;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

const customerInput = z.object({
  firstName: z.string().trim().min(1, "Ù†Ø§Ù… Ø±Ø§ ÙˆØ§Ø±Ø¯ Ú©Ù†ÛŒØ¯.").max(100),
  lastName: z.string().trim().min(1, "Ù†Ø§Ù… Ø®Ø§Ù†ÙˆØ§Ø¯Ú¯ÛŒ Ø±Ø§ ÙˆØ§Ø±Ø¯ Ú©Ù†ÛŒØ¯.").max(100),
  nationalCode: z.string().transform(toEnglishDigits).pipe(z.string().regex(/^\d{10}$/, "Ú©Ø¯ Ù…Ù„ÛŒ Ø¨Ø§ÛŒØ¯ Û±Û° Ø±Ù‚Ù… Ø¨Ø§Ø´Ø¯.")),
  mobile: z.string().transform(toEnglishDigits).pipe(z.string().regex(/^09\d{9}$/, "Ø´Ù…Ø§Ø±Ù‡ Ù…ÙˆØ¨Ø§ÛŒÙ„ Ø¨Ø§ÛŒØ¯ Ø¨Ø§ Û°Û¹ Ùˆ Û±Û± Ø±Ù‚Ù… ÙˆØ§Ø±Ø¯ Ø´ÙˆØ¯.")),
  telephone: z.string().trim().max(20).optional().default(""),
  economicCode: z.string().trim().max(32).optional().default(""),
  gender: z.preprocess(
    (value) => value === "" ? undefined : value,
    z.enum(["male", "female", "other"]).optional(),
  ),
  fatherName: z.string().trim().max(100).optional().default(""),
  birthDate: z.string().transform(normalizeDateDigits).refine(
    (value) => value === "" || isValidDateOnly(value),
    "ØªØ§Ø±ÛŒØ® ØªÙˆÙ„Ø¯ Ù…Ø¹ØªØ¨Ø± Ù†ÛŒØ³Øª.",
  ).optional().default(""),
  province: z.string().trim().max(100).optional().default(""),
  city: z.string().trim().max(100).optional().default(""),
  address: z.string().trim().max(4000).optional().default(""),
  maritalStatus: z.preprocess(
    (value) => value === "" ? undefined : value,
    z.enum(["single", "married", "divorced", "widowed"]).optional(),
  ),
  customerClass: z.enum(["bankdar", "wholesaler", "retailer"]).default("retailer"),
  tagIds: z.array(z.string().uuid()).default([]),
});

async function ensureActiveTags(tx: Prisma.TransactionClient, tagIds: string[]) {
  const uniqueIds = [...new Set(tagIds)];
  if (!uniqueIds.length) return uniqueIds;
  const matches = await tx.tag.findMany({
    where: { id: { in: uniqueIds }, isDeleted: false },
    select: { id: true },
  });
  if (matches.length !== uniqueIds.length) throw new Error("ÛŒÚ©ÛŒ Ø§Ø² ØªÚ¯â€ŒÙ‡Ø§ÛŒ Ø§Ù†ØªØ®Ø§Ø¨â€ŒØ´Ø¯Ù‡ Ù…Ø¹ØªØ¨Ø± Ù†ÛŒØ³Øª.");
  return uniqueIds;
}

async function requireAdmin() {
  await requirePermission("customers");
}

export async function listCustomers() {
  await requireAdmin();
  return db.customer.findMany({
    where: { isDeleted: false },
    orderBy: { customerCode: "desc" },
    include: {
      tags: {
        where: { tag: { is: { isDeleted: false } } },
        select: { tag: { select: { id: true, name: true, color: true } } },
      },
    },
  });
}

export async function createCustomer(input: unknown) {
  await requireAdmin();
  const parsed = customerInput.parse(input);

  try {
    const customer = await db.$transaction(async (tx) => {
      const tagIds = await ensureActiveTags(tx, parsed.tagIds);
      const created = await tx.customer.create({ data: getCustomerData(parsed) });
      if (tagIds.length) {
        await tx.customerTag.createMany({
          data: tagIds.map((tagId) => ({ customerId: created.id, tagId })),
        });
      }
      return created;
    });

    revalidatePath("/customers");
    return { success: true, customerCode: customer.customerCode };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new Error("Ø§ÛŒÙ† Ø´Ù…Ø§Ø±Ù‡ Ù…ÙˆØ¨Ø§ÛŒÙ„ Ù‚Ø¨Ù„Ø§Ù‹ Ø¨Ø±Ø§ÛŒ Ù…Ø´ØªØ±ÛŒ Ø¯ÛŒÚ¯Ø±ÛŒ Ø«Ø¨Øª Ø´Ø¯Ù‡ Ø§Ø³Øª.");
    }
    throw error;
  }
}

function getCustomerData(parsed: z.infer<typeof customerInput>) {
  return {
    firstName: parsed.firstName,
    lastName: parsed.lastName,
    nationalCode: parsed.nationalCode,
    mobile: parsed.mobile,
    telephone: parsed.telephone || null,
    economicCode: parsed.economicCode || null,
    gender: parsed.gender || null,
    fatherName: parsed.fatherName || null,
    birthDate: parsed.birthDate ? new Date(`${parsed.birthDate}T00:00:00.000Z`) : null,
    province: parsed.province || null,
    city: parsed.city || null,
    address: parsed.address || null,
    maritalStatus: parsed.maritalStatus || null,
    customerClass: parsed.customerClass,
  };
}

export async function updateCustomer(id: string, input: unknown) {
  await requireAdmin();
  const customerId = z.string().uuid().parse(id);
  const parsed = customerInput.parse(input);

  try {
    await db.$transaction(async (tx) => {
      const tagIds = await ensureActiveTags(tx, parsed.tagIds);
      await tx.customer.update({
        where: { id: customerId, isDeleted: false },
        data: getCustomerData(parsed),
      });
      await tx.customerTag.deleteMany({ where: { customerId } });
      if (tagIds.length) {
        await tx.customerTag.createMany({
          data: tagIds.map((tagId) => ({ customerId, tagId })),
        });
      }
    });
    revalidatePath("/customers");
    return { success: true };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new Error("Ø´Ù…Ø§Ø±Ù‡ Ù…ÙˆØ¨Ø§ÛŒÙ„ Ø¨Ø±Ø§ÛŒ Ù…Ø´ØªØ±ÛŒ Ø¯ÛŒÚ¯Ø±ÛŒ Ø«Ø¨Øª Ø´Ø¯Ù‡ Ø§Ø³Øª.");
    }
    throw error;
  }
}

export async function setCustomerActive(id: string, isActive: boolean) {
  await requireAdmin();
  const customerId = z.string().uuid().parse(id);
  const active = z.boolean().parse(isActive);
  const result = await db.customer.updateMany({
    where: { id: customerId, isDeleted: false },
    data: { isActive: active },
  });
  if (!result.count) throw new Error("Ù…Ø´ØªØ±ÛŒ Ù¾ÛŒØ¯Ø§ Ù†Ø´Ø¯.");
  revalidatePath("/customers");
  return { success: true };
}

export async function softDeleteCustomer(id: string) {
  await requireAdmin();
  const customerId = z.string().uuid().parse(id);
  const result = await db.customer.updateMany({
    where: { id: customerId, isDeleted: false },
    data: { isDeleted: true, deletedAt: new Date(), isActive: false },
  });
  if (!result.count) throw new Error("Ù…Ø´ØªØ±ÛŒ Ù¾ÛŒØ¯Ø§ Ù†Ø´Ø¯.");
  revalidatePath("/customers");
  return { success: true };
}
