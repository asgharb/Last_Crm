"use server";

import { Prisma } from "@prisma/client";
import { z } from "zod";
import { db } from "@/db";
import { auth } from "@/lib/auth";
import { requirePermission } from "@/lib/permissions";
const historyFilter = z.object({
  query: z.string().trim().max(100).default(""),
  date: z.string().refine(
    (value) => value === "" || /^\d{4}-\d{2}-\d{2}$/.test(value),
    "ØªØ§Ø±ÛŒØ® Ø¬Ø³ØªØ¬Ùˆ Ø¨Ø§ÛŒØ¯ Ø¨Ù‡ Ù‚Ø§Ù„Ø¨ Ø³Ø§Ù„-Ù…Ø§Ù‡-Ø±ÙˆØ² Ø¨Ø§Ø´Ø¯.",
  ).optional().default(""),
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(10).max(50).default(10),
});

async function requireAdmin() {
  await requirePermission("smsHistory");
}

function normalizeDigits(value: string) {
  return value.replace(/[\u0660-\u0669\u06F0-\u06F9]/g, (digit) => {
    const code = digit.charCodeAt(0);
    return String(code >= 0x06f0 ? code - 0x06f0 : code - 0x0660);
  });
}

function isValidIsoDate(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return false;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

function tehranMidnightUtc(year: number, month: number, day: number) {
  const utcGuess = Date.UTC(year, month - 1, day);
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Tehran",
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    second: "numeric",
    hourCycle: "h23",
  }).formatToParts(new Date(utcGuess));
  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  const localAsUtc = Date.UTC(
    Number(values.year),
    Number(values.month) - 1,
    Number(values.day),
    Number(values.hour),
    Number(values.minute),
    Number(values.second),
  );
  return new Date(utcGuess - (localAsUtc - utcGuess));
}

function getTehranDayRange(value: string) {
  const normalized = normalizeDigits(value);
  if (!isValidIsoDate(normalized)) throw new Error("ØªØ§Ø±ÛŒØ® Ø¬Ø³ØªØ¬Ùˆ Ù…Ø¹ØªØ¨Ø± Ù†ÛŒØ³Øª.");
  const [year, month, day] = normalized.split("-").map(Number);
  const nextDate = new Date(Date.UTC(year, month - 1, day + 1));
  return {
    gte: tehranMidnightUtc(year, month, day),
    lt: tehranMidnightUtc(nextDate.getUTCFullYear(), nextDate.getUTCMonth() + 1, nextDate.getUTCDate()),
  };
}

export async function listSmsHistory(input: unknown = {}) {
  await requireAdmin();
  const parsed = historyFilter.parse(input);
  const where: Prisma.SmsDeliveryWhereInput = { isDeleted: false };
  if (parsed.date) where.createdAt = getTehranDayRange(parsed.date);

  const query = normalizeDigits(parsed.query);
  if (query) {
    where.OR = [
      { customerName: { contains: query } },
      { recipientMobile: { contains: query } },
    ];
  }

  const [rows, total] = await Promise.all([
    db.smsDelivery.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (parsed.page - 1) * parsed.pageSize,
      take: parsed.pageSize,
      select: {
        id: true,
        customerName: true,
        recipientMobile: true,
        templateName: true,
        body: true,
        provider: true,
        providerMessageId: true,
        providerStatus: true,
        providerStatusMessage: true,
        createdAt: true,
      },
    }),
    db.smsDelivery.count({ where }),
  ]);

  return {
    rows,
    total,
    page: parsed.page,
    pageSize: parsed.pageSize,
    pageCount: Math.max(1, Math.ceil(total / parsed.pageSize)),
  };
}
