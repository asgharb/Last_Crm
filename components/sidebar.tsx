"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import {
    ChevronDown,
    Users,
    ContactRound,
    Tags,
    MessageSquareText,
    History,
    LogOut,
    ShieldCheck,
    Archive,
    SlidersHorizontal,
    MessageSquare,
    DatabaseZap
} from "lucide-react";
import { authClient } from "@/lib/auth-client";
import type { AccessModule } from "@/lib/access-modules";

interface MenuItem {
    href: string;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    module?: AccessModule;
    adminOnly?: boolean;
}

interface MenuGroup {
    id: string;
    title: string;
    icon: React.ComponentType<{ className?: string }>;
    items: MenuItem[];
}

const MENU_GROUPS: MenuGroup[] = [
    {
        id: "crm",
        title: "ارتباط با مشتریان",
        icon: ContactRound,
        items: [
            { href: "/customers", label: "مشتریان", icon: ContactRound, module: "customers" },
            { href: "/tags", label: "مدیریت تگ‌ها", icon: Tags, module: "tags" }
        ]
    },
    {
        id: "messaging",
        title: "سامانه پیام کوتاه",
        icon: MessageSquare,
        items: [
            { href: "/sms-templates", label: "قالب‌های پیامک", icon: MessageSquareText, module: "smsTemplates" },
            { href: "/sms-history", label: "تاریخچه پیامک", icon: History, module: "smsHistory" }
        ]
    },
    {
        id: "system",
        title: "مدیریت و سیستم",
        icon: SlidersHorizontal,
        items: [
            { href: "/users", label: "مدیریت کاربران", icon: Users, module: "users" },
            { href: "/role-permissions", label: "دسترسی نقش‌ها", icon: ShieldCheck, adminOnly: true },
            { href: "/backup", label: "پشتیبان‌گیری و بازیابی", icon: Archive, module: "backup" }
        ]
    }
];

export function Sidebar({
                            name,
                            role,
                            allowedModules
                        }: {
    name: string;
    role: string;
    allowedModules: AccessModule[];
}) {
    const pathname = usePathname();
    const router = useRouter();
    const allowed = new Set(allowedModules);

    // نگهداری وضعیت باز/بسته بودن هر گروه به صورت مستقل
    const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
        crm: true,
        messaging: true,
        system: true
    });

    const toggleGroup = (id: string) => {
        setOpenGroups((prev) => ({ ...prev, [id]: !prev[id] }));
    };

    async function logout() {
        await authClient.signOut();
        router.replace("/login");
        router.refresh();
    }

    const isItemVisible = (item: MenuItem) => {
        if (item.adminOnly && role !== "admin") return false;
        if (item.module && !allowed.has(item.module)) return false;
        return true;
    };

    return (
        <aside className="flex h-full w-64 shrink-0 flex-col border-l border-slate-800/80 bg-slate-950 text-slate-200 px-3 py-5 max-sm:w-[4.5rem] max-sm:px-2 select-none">
            {/* Header / Logo */}
            <div className="mb-6 flex items-center gap-3 px-2 max-sm:justify-center max-sm:px-0">
                <div className="grid size-10 place-items-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-lg shadow-indigo-500/20">
                    <ShieldCheck className="size-5" />
                </div>
                <div className="max-sm:hidden">
                    <div className="font-bold tracking-tight text-white">پنل مدیریت</div>
                    <div className="text-xs text-indigo-400/80">داشبورد سازمانی</div>
                </div>
            </div>

            {/* Menu List */}
            <nav className="flex-1 space-y-4 overflow-y-auto pr-0.5">
                {MENU_GROUPS.map((group) => {
                    const visibleItems = group.items.filter(isItemVisible);
                    if (visibleItems.length === 0) return null;

                    const isOpen = openGroups[group.id];
                    const GroupIcon = group.icon;

                    return (
                        <div key={group.id} className="space-y-1">
                            {/* Group Header (Parent) */}
                            <button
                                type="button"
                                onClick={() => toggleGroup(group.id)}
                                className="flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-xs font-semibold text-slate-400 transition-colors hover:bg-slate-900 hover:text-slate-200 max-sm:justify-center"
                            >
                                <div className="flex items-center gap-2">
                                    <GroupIcon className="size-4 text-indigo-400 max-sm:size-5" />
                                    <span className="max-sm:hidden">{group.title}</span>
                                </div>
                                <ChevronDown
                                    className={`size-3.5 text-slate-500 transition-transform duration-200 max-sm:hidden ${
                                        isOpen ? "" : "-rotate-90"
                                    }`}
                                />
                            </button>

                            {/* Group Children */}
                            {isOpen && (
                                <div className="space-y-1 border-r border-indigo-950/60 pr-2 mr-3 max-sm:mr-0 max-sm:border-r-0 max-sm:pr-0">
                                    {visibleItems.map((menuItem) => {
                                        const ItemIcon = menuItem.icon;
                                        const isActive = pathname === menuItem.href;

                                        return (
                                            <Link
                                                key={menuItem.href}
                                                href={menuItem.href}
                                                title={menuItem.label}
                                                aria-label={menuItem.label}
                                                className={`group flex items-center gap-3 rounded-lg px-3 py-2 text-xs font-medium transition-all max-sm:justify-center max-sm:px-2 ${
                                                    isActive
                                                        ? "bg-indigo-600 text-white shadow-sm shadow-indigo-600/30"
                                                        : "text-slate-400 hover:bg-slate-900/90 hover:text-indigo-200"
                                                }`}
                                            >
                                                <ItemIcon
                                                    className={`size-4 transition-colors ${
                                                        isActive
                                                            ? "text-white"
                                                            : "text-slate-400 group-hover:text-indigo-400"
                                                    }`}
                                                />
                                                <span className="truncate max-sm:sr-only">
                                                    {menuItem.label}
                                                </span>
                                            </Link>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    );
                })}
            </nav>

            {/* Footer / User Info */}
            <div className="mt-auto border-t border-slate-800/80 pt-4">
                <div className="flex items-center gap-3 rounded-xl bg-slate-900/50 p-2 max-sm:flex-col max-sm:gap-2 max-sm:bg-transparent max-sm:px-0">
                    <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-indigo-950 text-indigo-300 font-bold border border-indigo-800/40 text-sm">
                        {name.slice(0, 1)}
                    </div>
                    <div className="min-w-0 flex-1 max-sm:hidden">
                        <div className="truncate text-xs font-medium text-slate-200">{name}</div>
                        <div className="text-[11px] text-indigo-400/80">
                            {role === "admin" ? "مدیر سیستم" : "کاربر"}
                        </div>
                    </div>
                    <button
                        onClick={logout}
                        title="خروج"
                        aria-label="خروج"
                        className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-rose-950/40 hover:text-rose-400"
                    >
                        <LogOut className="size-4" />
                    </button>
                </div>
            </div>
        </aside>
    );
}
