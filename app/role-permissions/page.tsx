import {listRolePermissions} from "@/lib/actions/permissions";
import {RolePermissionsManager} from "./_components/role-permissions-manager";

export default async function RolePermissionsPage() {
    const {roles} = await listRolePermissions();
    return <section className="mx-auto max-w-7xl p-5 sm:p-8 lg:p-10">
        <header className="mb-7"><p className="mb-2 text-sm text-zinc-500">مدیریت سیستم / دسترسی نقش‌ها</p><h1
            className="text-3xl font-bold tracking-tight">دسترسی نقش‌ها</h1>
        </header>
        <RolePermissionsManager initialRoles={roles}/>
    </section>;
}
