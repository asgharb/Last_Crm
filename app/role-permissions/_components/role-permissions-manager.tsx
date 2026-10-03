"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Check, LockKeyhole, Save } from "lucide-react";
import { ACCESS_MODULES, type AccessModule } from "@/lib/access-modules";
import { saveRolePermissions } from "@/lib/actions/permissions";

type RoleRow = {
  role: "admin" | "user";
  label: string;
  userCount: number;
  permissions: Record<AccessModule, boolean>;
};

export function RolePermissionsManager({ initialRoles }: { initialRoles: RoleRow[] }) {
  const router = useRouter();
  const [roles, setRoles] = useState(initialRoles);
  const [pending, startTransition] = useTransition();
  const [dirty, setDirty] = useState(false);

  function toggle(module: AccessModule, allowed: boolean) {
    setRoles((current) => current.map((role) => role.role === "user"
      ? { ...role, permissions: { ...role.permissions, [module]: allowed } }
      : role));
    setDirty(true);
  }

  function save() {
    const role = roles.find((item) => item.role === "user");
    if (!role) return;
    startTransition(async () => {
      try {
        await saveRolePermissions({ role: "user", permissions: role.permissions });
        setDirty(false);
        toast.success("دسترسی‌های نقش کاربر ذخیره شد.");
        router.refresh();
      } catch (error) {
        toast.error("ذخیرهٔ دسترسی‌ها انجام نشد.", { description: error instanceof Error ? error.message : undefined });
      }
    });
  }

  return <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/70">
    <div className="overflow-x-auto">
      <table className="w-full min-w-[760px] text-right text-sm">
        <thead className="bg-zinc-950/70 text-xs text-zinc-500"><tr>
          <th className="px-4 py-3 font-medium">نقش</th><th className="px-4 py-3 font-medium">کاربران</th>
          {ACCESS_MODULES.map((module) => <th key={module.key} className="px-3 py-3 text-center font-medium">{module.label}</th>)}
        </tr></thead>
        <tbody className="divide-y divide-zinc-800">
          {roles.map((role) => <tr key={role.role}>
            <th scope="row" className="whitespace-nowrap px-4 py-4 font-semibold text-zinc-200">{role.label}</th>
            <td className="px-4 py-4 text-zinc-400">{new Intl.NumberFormat("fa-IR").format(role.userCount)}</td>
            {ACCESS_MODULES.map((module) => <td key={module.key} className="px-3 py-4 text-center">
              {role.role === "admin" ? <span title="مدیر دسترسی کامل دارد" className="inline-flex items-center justify-center text-emerald-400"><Check className="size-4" /><span className="sr-only">دسترسی کامل و ثابت</span></span> : module.adminOnly ? <span title="فقط مدیر سیستم" className="inline-flex items-center justify-center text-zinc-600"><LockKeyhole className="size-4" /><span className="sr-only">فقط مدیر سیستم</span></span> : (
                <label className="inline-flex cursor-pointer items-center justify-center rounded-md p-1 hover:bg-zinc-800">
                  <input type="checkbox" checked={role.permissions[module.key]} onChange={(event) => toggle(module.key, event.target.checked)} aria-label={`${module.label} برای نقش کاربر`} className="size-4 accent-zinc-100" />
                </label>
              )}
            </td>)}
          </tr>)}
        </tbody>
      </table>
    </div>
    <div className="flex flex-col gap-3 border-t border-zinc-800 p-4 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-xs leading-5 text-zinc-500"><LockKeyhole className="ml-1 inline size-3.5" />نقش مدیر همیشه به همهٔ بخش‌ها دسترسی دارد. تغییرات نقش کاربر فقط پس از ذخیره اعمال می‌شوند.</p>
      <button type="button" onClick={save} disabled={!dirty || pending} className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-zinc-100 px-4 py-2.5 text-sm font-semibold text-zinc-950 hover:bg-white disabled:cursor-not-allowed disabled:opacity-40">
        {pending ? <Save className="size-4 animate-pulse" /> : <Check className="size-4" />}{pending ? "در حال ذخیره..." : "ذخیرهٔ دسترسی‌ها"}
      </button>
    </div>
  </div>;
}
