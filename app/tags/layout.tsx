import {ProtectedLayout} from "@/components/protected-layout";

export default async function TagsLayout({children}: { children: React.ReactNode }) {
    return <ProtectedLayout module="tags">{children}</ProtectedLayout>;
}
