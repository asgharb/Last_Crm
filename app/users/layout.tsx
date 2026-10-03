import { ProtectedLayout } from "@/components/protected-layout";
export default async function UsersLayout({ children }: { children: React.ReactNode }) {
  return <ProtectedLayout module="users">{children}</ProtectedLayout>;
}
