import { ProtectedLayout } from "@/components/protected-layout";

export default async function BackupLayout({ children }: { children: React.ReactNode }) {
  return <ProtectedLayout module="backup">{children}</ProtectedLayout>;
}
