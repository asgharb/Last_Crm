import { ProtectedLayout } from "@/components/protected-layout";

export default async function CustomersLayout({ children }: { children: React.ReactNode }) {
  return <ProtectedLayout module="customers">{children}</ProtectedLayout>;
}
