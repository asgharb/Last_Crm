import {headers} from "next/headers";
import {redirect} from "next/navigation";
import {Sidebar} from "@/components/sidebar";
import {auth} from "@/lib/auth";
import {getAccessibleModules, hasPermission, type AccessModule} from "@/lib/permissions";
import {getOrganizationSettings} from "@/lib/organization-settings";

async function authenticatedShell(children: React.ReactNode, session: NonNullable<Awaited<ReturnType<typeof auth.api.getSession>>>, allowedModules: AccessModule[]) {
    const settings = await getOrganizationSettings();
    return <div className="flex h-screen w-full overflow-hidden" dir="rtl"><Sidebar name={session.user.name} role={session.user.role ?? "user"}
        allowedModules={allowedModules} organizationName={settings.organizationName} logoData={settings.logoData}/>
        <main className="app-main h-full min-w-0 flex-1 overflow-x-hidden overflow-y-auto bg-slate-900 text-slate-100">{children}</main>
    </div>;
}

export async function AuthenticatedLayout({children}: { children: React.ReactNode }) {
    const session = await auth.api.getSession({headers: await headers()});
    if (!session) redirect("/login");
    return authenticatedShell(children, session, await getAccessibleModules(session.user.role ?? "user"));
}

export async function ProtectedLayout({children, module}: { children: React.ReactNode; module: AccessModule }) {
    const session = await auth.api.getSession({headers: await headers()});
    if (!session) redirect("/login");
    const role = session.user.role ?? "user";
    if (!(await hasPermission(role, module))) redirect("/access-denied");
    const allowedModules = await getAccessibleModules(role);
    return authenticatedShell(children, session, allowedModules);
}

export async function AdminLayout({children}: { children: React.ReactNode }) {
    const session = await auth.api.getSession({headers: await headers()});
    if (!session) redirect("/login");
    if (session.user.role !== "admin") redirect("/access-denied");
    return authenticatedShell(children, session, await getAccessibleModules("admin"));
}
