import { randomUUID } from "node:crypto";

export type SmsProviderRequest = { to: string; body: string };
export type SmsProviderReceipt = {
  provider: string;
  providerMessageId: string;
  status: string;
  statusMessage: string;
  response: Record<string, string | boolean>;
};

export interface SmsProvider {
  readonly name: string;
  send(request: SmsProviderRequest): Promise<SmsProviderReceipt>;
}

class MockSmsProvider implements SmsProvider {
  readonly name = "mock";

  async send({ to }: SmsProviderRequest): Promise<SmsProviderReceipt> {
    return {
      provider: this.name,
      providerMessageId: `mock-${randomUUID()}`,
      status: "sent_to_operator",
      statusMessage: "تحویل به مخابرات (شبیه‌سازی‌شده)",
      response: { accepted: true, simulated: true, recipient: to },
    };
  }
}

export function createSmsProvider(): SmsProvider {
  const provider = process.env.SMS_PROVIDER?.trim().toLowerCase() || "mock";
  if (provider === "mock") return new MockSmsProvider();
  throw new Error(`SMS provider "${provider}" is not configured. Use "mock" until a real gateway is selected.`);
}
