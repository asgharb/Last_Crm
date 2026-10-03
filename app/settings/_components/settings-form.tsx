"use client";

import { useState, useTransition } from "react";
import { Palette, Upload } from "lucide-react";
import { toast } from "sonner";
import { updateOrganizationSettings } from "@/lib/actions/organization-settings";

type Settings = {
  organizationName: string;
  logoData: string | null;
  themeMode: string;
  themeColor: string;
};

const colors = [
  ["indigo", "نیلی", "#4f46e5"],
  ["blue", "آبی", "#2563eb"],
  ["emerald", "سبز", "#059669"],
  ["rose", "رز", "#e11d48"],
  ["amber", "کهربایی", "#d97706"],
] as const;

export function SettingsForm({ initialSettings }: { initialSettings: Settings }) {
  const [pending, startTransition] = useTransition();
  const [logoPreview, setLogoPreview] = useState(initialSettings.logoData);
  const [removeLogo, setRemoveLogo] = useState(false);

  function submit(formData: FormData) {
    formData.set("removeLogo", String(removeLogo));
    startTransition(async () => {
      try {
        await updateOrganizationSettings(formData);
        toast.success("تنظیمات سازمان ذخیره شد.");
        window.location.reload();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "ذخیره تنظیمات انجام نشد.");
      }
    });
  }

  return <form action={submit} className="space-y-6 rounded-2xl border border-zinc-800 bg-zinc-900/70 p-5 sm:p-7">
    <div className="grid gap-6 lg:grid-cols-[1fr_18rem]">
      <div className="space-y-5">
        <label className="block text-sm text-zinc-300">نام سازمان
          <input name="organizationName" required minLength={2} maxLength={160} defaultValue={initialSettings.organizationName}
                 className="mt-1.5 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2.5 outline-none focus:border-zinc-500" />
        </label>
        <div>
          <div className="mb-2 text-sm text-zinc-300">حالت نمایش</div>
          <div className="grid grid-cols-2 gap-3">
            {[['dark', 'تیره'], ['light', 'روشن']].map(([value, label]) => <label key={value} className="cursor-pointer rounded-xl border border-zinc-700 bg-zinc-950 p-4 text-sm">
              <input type="radio" name="themeMode" value={value} defaultChecked={initialSettings.themeMode === value} className="ml-2 accent-indigo-500" />{label}
            </label>)}
          </div>
        </div>
        <div>
          <div className="mb-2 flex items-center gap-2 text-sm text-zinc-300"><Palette className="size-4" />رنگ اصلی</div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
            {colors.map(([value, label, color]) => <label key={value} className="cursor-pointer rounded-xl border border-zinc-700 bg-zinc-950 p-3 text-center text-xs">
              <input type="radio" name="themeColor" value={value} defaultChecked={initialSettings.themeColor === value} className="sr-only peer" />
              <span className="mx-auto mb-2 block size-7 rounded-full ring-2 ring-transparent ring-offset-2 ring-offset-slate-950 peer-checked:ring-white" style={{ backgroundColor: color }} />
              {label}
            </label>)}
          </div>
        </div>
      </div>
      <div className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-4">
        <div className="mb-3 text-sm font-medium">لوگوی سازمان</div>
        <div className="mb-4 grid aspect-square place-items-center overflow-hidden rounded-2xl border border-dashed border-zinc-700 bg-zinc-900">
          {logoPreview && !removeLogo ? <img src={logoPreview} alt="پیش‌نمایش لوگو" className="max-h-full max-w-full object-contain p-4" /> : <Upload className="size-10 text-zinc-600" />}
        </div>
        <input name="logo" type="file" accept="image/png,image/jpeg,image/webp" className="block w-full text-xs text-zinc-400 file:ml-3 file:rounded-lg file:border-0 file:bg-zinc-800 file:px-3 file:py-2 file:text-zinc-200"
               onChange={(event) => { const file = event.target.files?.[0]; if (file) { setRemoveLogo(false); setLogoPreview(URL.createObjectURL(file)); } }} />
        <p className="mt-2 text-xs leading-5 text-zinc-500">PNG، JPEG یا WebP، حداکثر یک مگابایت</p>
        {logoPreview && <button type="button" onClick={() => { setRemoveLogo(true); setLogoPreview(null); }} className="mt-3 text-xs text-rose-400 hover:text-rose-300">حذف لوگو</button>}
      </div>
    </div>
    <div className="flex justify-end border-t border-zinc-800 pt-5">
      <button disabled={pending} className="rounded-lg bg-zinc-100 px-5 py-2.5 text-sm font-semibold text-zinc-950 hover:bg-white disabled:opacity-50">{pending ? "در حال ذخیره..." : "ذخیره تنظیمات"}</button>
    </div>
  </form>;
}
