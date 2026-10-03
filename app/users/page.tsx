import {listUsers} from "@/lib/actions/users";
import {UsersTable} from "./_components/users-table";

export default async function UsersPage() {
    const users = await listUsers();
    return <section className="mx-auto max-w-8xl p-6 sm:p-10">
        <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
            <div><p className="mb-2 text-sm text-zinc-500">مدیریت سیستم / کاربران</p><h1
                className="text-3xl font-bold tracking-tight">مدیریت کاربران</h1>
            </div>
        </header>
        <UsersTable initialUsers={users}/></section>;
}
