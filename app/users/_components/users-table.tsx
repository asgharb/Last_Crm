"use client";

import {useEffect, useState, useTransition} from "react";
import {useRouter} from "next/navigation";
import {toast} from "sonner";
import {Pencil, Plus, Search, Trash2, Users, UserRound, Power} from "lucide-react";
import {createUser, setUserActive, softDeleteUser, updateUser} from "@/lib/actions/users";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogTitle,
} from "@/components/ui/dialog";

type User = {
    id: string;
    name: string;
    username: string | null;
    displayUsername?: string | null;
    image?: string | null;
    role: string;
    isActive: boolean;
    createdAt: Date;
};

type FormState = {
    id?: string;
    name: string;
    username: string;
    role: "user" | "admin";
    isActive: boolean;
    password: string;
};

const emptyForm: FormState = {
    name: "",
    username: "",
    role: "user",
    isActive: true,
    password: "",
};

export function UsersTable({initialUsers}: { initialUsers: User[] }) {
    const router = useRouter();
    const [users, setUsers] = useState(initialUsers);
    const [query, setQuery] = useState("");
    const [dialogOpen, setDialogOpen] = useState(false);
    const [form, setForm] = useState<FormState>(emptyForm);
    const [pending, startTransition] = useTransition();

    useEffect(() => {
        setUsers(initialUsers);
    }, [initialUsers]);

    const visibleUsers = users.filter((user) =>
        `${user.name} ${user.displayUsername ?? user.username ?? ""}`
            .toLocaleLowerCase("fa")
            .includes(query.toLocaleLowerCase("fa")),
    );

    function reportError(error: unknown) {
        toast.error("عملیات انجام نشد", {
            description:
                error instanceof Error ? error.message : "لطفاً دوباره تلاش کنید.",
        });
    }

    function saveUser(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        startTransition(async () => {
            try {
                if (form.id) {
                    await updateUser({
                        id: form.id,
                        name: form.name,
                        username: form.username,
                        role: form.role,
                        isActive: form.isActive,
                    });
                } else {
                    await createUser(form);
                }

                toast.success(form.id ? "اطلاعات کاربر ویرایش شد" : "کاربر جدید ایجاد شد");
                setDialogOpen(false);
                router.refresh();
            } catch (error) {
                reportError(error);
            }
        });
    }

    function toggleUser(user: User) {
        startTransition(async () => {
            try {
                await setUserActive(user.id, !user.isActive);
                setUsers((current) =>
                    current.map((row) =>
                        row.id === user.id ? {...row, isActive: !row.isActive} : row,
                    ),
                );
                toast.success(user.isActive ? "کاربر غیرفعال شد" : "کاربر فعال شد");
            } catch (error) {
                reportError(error);
            }
        });
    }

    function deleteUser(user: User) {
        startTransition(async () => {
            try {
                await softDeleteUser(user.id);
                setUsers((current) => current.filter((row) => row.id !== user.id));
                toast.warning("کاربر حذف شد", {
                    description: "حساب کاربر به‌صورت نرم‌افزاری حذف شد.",
                });
            } catch (error) {
                reportError(error);
            }
        });
    }

    function openEditDialog(user: User) {
        setForm({
            id: user.id,
            name: user.name,
            username: user.displayUsername ?? user.username ?? "",
            role: user.role === "admin" ? "admin" : "user",
            isActive: user.isActive,
            password: "",
        });
        setDialogOpen(true);
    }

    return (
        <>
            <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/70">
                <div
                    className="flex min-w-0 flex-col gap-3 border-b border-zinc-800 p-3 sm:flex-row sm:items-center sm:justify-between sm:p-4">
                    <div className="relative w-full min-w-0 sm:max-w-xs sm:flex-1">
                        <Search className="absolute right-3 top-1/2 size-4 -translate-y-1/2 text-zinc-500"/>
                        <input
                            value={query}
                            onChange={(event) => setQuery(event.target.value)}
                            placeholder="جست‌وجوی نام یا ایمیل"
                            className="w-full rounded-lg border border-zinc-800 bg-zinc-950 py-2 pl-3 pr-9 text-sm outline-none focus:border-zinc-600"
                        />
                    </div>
                    <button
                        onClick={() => {
                            setForm(emptyForm);
                            setDialogOpen(true);
                        }}
                        className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-zinc-100 px-3 py-2 text-sm font-semibold text-zinc-950 hover:bg-white sm:px-4"
                    >
                        <Plus className="size-4"/>
                        <span className="max-[380px]:hidden">ایجاد کاربر جدید</span>
                        <span className="min-[381px]:hidden">کاربر جدید</span>
                    </button>
                </div>

                <div className="w-full overflow-x-auto overscroll-x-contain">
                    <table className="w-full min-w-[680px] table-fixed text-right text-xs sm:text-sm">
                        <thead className="bg-zinc-950/70 text-xs text-zinc-500">
                        <tr>
                            <th className="w-[40%] px-2 py-3 font-medium sm:w-[24%] sm:px-5">کاربر</th>
                            <th className="px-5 py-3 font-medium">نام کاربری</th>
                            <th className="w-[12%] px-3 py-3 font-medium">نقش</th>
                            <th className="w-[24%] px-2 py-3 font-medium sm:w-[14%] sm:px-3">وضعیت</th>
                            <th className="w-[16%] px-3 py-3 font-medium">تاریخ ایجاد</th>
                            <th className="w-[36%] px-2 py-3 font-medium sm:w-[26%] sm:px-3">عملیات</th>
                        </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800">
                        {visibleUsers.map((user) => (
                            <tr key={user.id} className="hover:bg-zinc-800/30">
                                <td className="overflow-hidden px-2 py-4 sm:px-5">
                                    <div className="flex min-w-0 items-center gap-2 sm:gap-3">
                                        {user.image ? (
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <img
                                                src={user.image}
                                                alt=""
                                                className="size-8 shrink-0 rounded-full object-cover sm:size-9"
                                            />
                                        ) : (
                                            <div
                                                className="grid size-8 shrink-0 place-items-center rounded-full bg-zinc-800 text-zinc-300 sm:size-9">
                                                <UserRound className="size-4"/>
                                            </div>
                                        )}
                                        <span className="truncate font-medium">{user.name}</span>
                                    </div>
                                </td>
                                <td className="truncate px-5 py-4 text-zinc-400">{user.displayUsername ?? user.username ?? "—"}</td>
                                <td className="px-3 py-4">
                  <span className="rounded-full border border-zinc-700 px-2.5 py-1 text-xs">
                    {user.role === "admin" ? "مدیر" : "کاربر"}
                  </span>
                                </td>
                                <td className="px-2 py-4 sm:px-3">
                  <span
                      className={`inline-flex items-center gap-1.5 text-xs ${user.isActive ? "text-emerald-400" : "text-zinc-500"}`}>
                    <span
                        className={`size-1.5 shrink-0 rounded-full ${user.isActive ? "bg-emerald-400" : "bg-zinc-600"}`}/>
                      {user.isActive ? "فعال" : "غیرفعال"}
                  </span>
                                </td>
                                <td className="px-3 py-4 text-zinc-500">
                                    {new Intl.DateTimeFormat("fa-IR", {dateStyle: "medium"}).format(
                                        new Date(user.createdAt),
                                    )}
                                </td>
                                <td className="px-1 py-3 sm:px-3">
                                    <div className="flex flex-wrap items-center gap-1">
                                        <button
                                            disabled={pending}
                                            onClick={() => toggleUser(user)}
                                            className={`rounded-md px-1.5 py-1.5 text-[10px] hover:bg-zinc-800 hover:text-white sm:px-2 sm:text-xs ${
                                                user.isActive ? "text-amber-400" : "text-emerald-400"
                                            }`}
                                        >
                                            <Power className="size-4" />
                                        </button>

                                        <button
                                            onClick={() => openEditDialog(user)}
                                            aria-label="ویرایش کاربر"
                                            className="rounded-md p-1.5 text-blue-500 hover:bg-zinc-800 hover:text-white"
                                        >
                                            <Pencil className="size-4"/>
                                        </button>
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <button
                                                    aria-label="حذف کاربر"
                                                    className="rounded-md p-1.5  text-red-400 hover:bg-red-950 hover:text-red-300"
                                                >
                                                    <Trash2 className="size-4"/>
                                                </button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogTitle className="text-lg font-bold">حذف
                                                    کاربر</AlertDialogTitle>
                                                <AlertDialogDescription className="mt-2 text-sm text-zinc-400">
                                                    حساب «{user.name}» حذف نرم‌افزاری شود؟
                                                </AlertDialogDescription>
                                                <div className="mt-6 flex gap-2">
                                                    <AlertDialogCancel
                                                        className="rounded-lg border border-zinc-700 px-4 py-2 text-sm">
                                                        انصراف
                                                    </AlertDialogCancel>
                                                    <AlertDialogAction
                                                        onClick={() => deleteUser(user)}
                                                        className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold hover:bg-red-500"
                                                    >
                                                        حذف کاربر
                                                    </AlertDialogAction>
                                                </div>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>

                {visibleUsers.length === 0 && (
                    <div className="flex flex-col items-center gap-2 py-16 text-sm text-zinc-500">
                        <Users className="size-7"/>
                        کاربری پیدا نشد.
                    </div>
                )}
                <div className="border-t border-zinc-800 px-5 py-3 text-xs text-zinc-500">
                    {visibleUsers.length} کاربر
                </div>
            </div>

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent>
                    <DialogTitle>{form.id ? "ویرایش کاربر" : "ایجاد کاربر جدید"}</DialogTitle>
                    <DialogDescription>اطلاعات حساب و سطح دسترسی را وارد کنید.</DialogDescription>
                    <form onSubmit={saveUser} className="mt-6 space-y-4">
                        <label className="block space-y-1.5 text-sm">
                            نام و نام خانوادگی
                            <input
                                required
                                minLength={2}
                                value={form.name}
                                onChange={(event) => setForm({...form, name: event.target.value})}
                                className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2.5 outline-none focus:border-zinc-500"
                            />
                        </label>
                        <label className="block space-y-1.5 text-sm">
                            نام کاربری
                            <input
                                required
                                type="text"
                                minLength={3}
                                maxLength={30}
                                autoComplete="username"
                                value={form.username}
                                onChange={(event) => setForm({...form, username: event.target.value})}
                                className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2.5 outline-none focus:border-zinc-500"
                            />
                        </label>
                        {!form.id && (
                            <label className="block space-y-1.5 text-sm">
                                گذرواژه اولیه
                                <input
                                    required
                                    minLength={12}
                                    type="password"
                                    value={form.password}
                                    onChange={(event) => setForm({...form, password: event.target.value})}
                                    className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2.5 outline-none focus:border-zinc-500"
                                />
                                <span className="block text-xs text-zinc-500">حداقل ۱۲ نویسه</span>
                            </label>
                        )}
                        <label className="block space-y-1.5 text-sm">
                            نقش
                            <select
                                value={form.role}
                                onChange={(event) => setForm({...form, role: event.target.value as FormState["role"]})}
                                className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2.5"
                            >
                                <option value="user">کاربر</option>
                                <option value="admin">مدیر</option>
                            </select>
                        </label>
                        <label className="flex items-center gap-2 text-sm">
                            <input
                                type="checkbox"
                                checked={form.isActive}
                                onChange={(event) => setForm({...form, isActive: event.target.checked})}
                            />
                            حساب فعال باشد
                        </label>
                        <div className="flex justify-end gap-2 pt-2">
                            <button
                                type="button"
                                onClick={() => setDialogOpen(false)}
                                className="rounded-lg border border-zinc-700 px-4 py-2 text-sm"
                            >
                                انصراف
                            </button>
                            <button
                                disabled={pending}
                                className="rounded-lg bg-zinc-100 px-4 py-2 text-sm font-semibold text-zinc-950 disabled:opacity-50"
                            >
                                {pending ? "در حال ذخیره…" : "ذخیره"}
                            </button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>
        </>
    );
}
