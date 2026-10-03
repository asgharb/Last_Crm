import { AdminLayout } from "@/components/protected-layout";

export default function RolePermissionsLayout({ children }: { children: React.ReactNode }) {
  return <AdminLayout>{children}</AdminLayout>;
}
