import { ProtectedLayout } from "@/components/protected-layout";

export default async function SmsHistoryLayout({ children }: { children: React.ReactNode }) {
  return <ProtectedLayout module="smsHistory">{children}</ProtectedLayout>;
}
