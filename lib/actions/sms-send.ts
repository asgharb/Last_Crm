"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/db";
import { auth } from "@/lib/auth";
import { requirePermission, requireAnyPermission } from "@/lib/permissions";
import { createSmsProvider } from "@/lib/sms/provider";
import { renderCustomerSms } from "@/lib/sms/render-template";

const sendInput = z.object({
  customerIds: z.array(z.string().uuid()).min(1).max(100),
  templateId: z.string().uuid(),
});

async function requireAdmin() {
  await requirePermission("customers");
}

export async function listActiveSmsTemplates() {
  await requireAnyPermission(["customers", "smsTemplates"]);
  return db.smsTemplate.findMany({
    where: { isActive: true, isDeleted: false },
    orderBy: { name: "asc" },
    select: { id: true, name: true, content: true },
  });
}

export async function sendSmsBatch(input: unknown) {
  await requireAdmin();
  const parsed = sendInput.parse(input);
  const customerIds = [...new Set(parsed.customerIds)];
  const provider = createSmsProvider();

  const [template, customers] = await Promise.all([
    db.smsTemplate.findFirst({
      where: { id: parsed.templateId, isActive: true, isDeleted: false },
      include: {
        placeholders: {
          where: { placeholder: { is: { isDeleted: false } } },
          select: { placeholder: { select: { token: true, customerField: true } } },
        },
      },
    }),
    db.customer.findMany({
      where: { id: { in: customerIds }, isActive: true, isDeleted: false },
      include: {
        tags: {
          where: { tag: { is: { isDeleted: false } } },
          select: { tag: { select: { name: true } } },
        },
      },
    }),
  ]);

  if (!template) throw new Error("Ù‚Ø§Ù„Ø¨ ÙØ¹Ø§Ù„ Ù¾ÛŒØ§Ù…Ú© Ù¾ÛŒØ¯Ø§ Ù†Ø´Ø¯.");
  if (customers.length !== customerIds.length) {
    throw new Error("ÛŒÚ© ÛŒØ§ Ú†Ù†Ø¯ Ù…Ø´ØªØ±ÛŒ Ø§Ù†ØªØ®Ø§Ø¨â€ŒØ´Ø¯Ù‡ ØºÛŒØ±ÙØ¹Ø§Ù„ Ø§Ø³Øª ÛŒØ§ Ø¯ÛŒÚ¯Ø± Ø¯Ø± Ø¯Ø³ØªØ±Ø³ Ù†ÛŒØ³Øª.");
  }

  const rendered = customers.map((customer) => ({
    customer,
    body: renderCustomerSms(
      template.content,
      template.placeholders.map(({ placeholder }) => placeholder),
      customer,
    ),
  }));

  let sent = 0;
  let failed = 0;
  for (const { customer, body } of rendered) {
    const delivery = await db.smsDelivery.create({
      data: {
        customerId: customer.id,
        templateId: template.id,
        customerName: `${customer.firstName} ${customer.lastName}`.trim(),
        templateName: template.name,
        recipientMobile: customer.mobile,
        body,
        provider: provider.name,
        providerStatus: "queued",
      },
      select: { id: true },
    });

    try {
      const receipt = await provider.send({ to: customer.mobile, body });
      await db.smsDelivery.update({
        where: { id: delivery.id },
        data: {
          provider: receipt.provider,
          providerMessageId: receipt.providerMessageId,
          providerStatus: receipt.status,
          providerStatusMessage: receipt.statusMessage,
          providerResponse: JSON.stringify(receipt.response),
        },
      });
      sent += 1;
    } catch (error) {
      await db.smsDelivery.update({
        where: { id: delivery.id },
        data: {
          providerStatus: "not_delivered",
          providerStatusMessage: error instanceof Error ? error.message.slice(0, 500) : "SMS provider request failed.",
        },
      });
      failed += 1;
    }
  }

  revalidatePath("/sms-history");
  return { sent, failed, simulated: provider.name === "mock" };
}
