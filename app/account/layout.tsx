import { AuthenticatedLayout } from "@/components/protected-layout";
export default function AccountLayout({ children }: { children: React.ReactNode }) { return <AuthenticatedLayout>{children}</AuthenticatedLayout>; }
