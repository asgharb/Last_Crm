import {headers} from "next/headers";
import {redirect} from "next/navigation";
import {Sidebar} from "@/components/sidebar";
import {auth} from "@/lib/auth";
import {getAccessibleModules, hasPermission, type AccessModule} from "@/lib/permissions";

export async function ProtectedLayout({children, module}: { children: React.ReactNode; module: AccessModule }) {
    const session = await auth.api.getSession({headers: await headers()});
    if (!session) redirect("/login");
    const role = session.user.role ?? "user";
    if (!(await hasPermission(role, module))) redirect("/access-denied");
    const allowedModules = await getAccessibleModules(role);
    return <div className="flex h-screen w-full overflow-hidden" dir="rtl"><Sidebar name={session.user.name} role={role}
                                                                                    allowedModules={allowedModules}/>
        <main className="h-full min-w-0 flex-1 overflow-x-hidden overflow-y-auto">{children}</main>
    </div>;
}

export async function AdminLayout({children}: { children: React.ReactNode }) {
    const session = await auth.api.getSession({headers: await headers()});
    if (!session) redirect("/login");
    if (session.user.role !== "admin") redirect("/access-denied");
    return <div className="flex h-screen w-full overflow-hidden" dir="rtl"><Sidebar name={session.user.name}
                                                                                    role="admin"
                                                                                    allowedModules={await getAccessibleModules("admin")}/>
        <main className="h-full min-w-0 flex-1 overflow-x-hidden overflow-y-auto">{children}</main>
    </div>;
}
