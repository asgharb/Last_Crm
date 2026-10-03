import {redirect} from "next/navigation";
import {headers} from "next/headers";
import {auth} from "@/lib/auth";
import {getAccessibleModules} from "@/lib/permissions";

export default async function Home() {
    const session = await auth.api.getSession({headers: await headers()});
    if (!session) redirect("/login");
    if (session.user.role === "admin") redirect("/users");
    const modules = await getAccessibleModules(session.user.role ?? "user");
    redirect(modules.length ? ({
        customers: "/customers",
        tags: "/tags",
        smsTemplates: "/sms-templates",
        smsHistory: "/sms-history",
        users: "/users",
        backup: "/backup"
    } as const)[modules[0]] : "/access-denied");
}
