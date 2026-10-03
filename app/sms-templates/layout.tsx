import { ProtectedLayout } from "@/components/protected-layout";

export default async function SmsTemplatesLayout({ children }: { children: React.ReactNode }) {
  return <ProtectedLayout module="smsTemplates">{children}</ProtectedLayout>;
}
