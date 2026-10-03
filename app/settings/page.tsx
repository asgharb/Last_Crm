import { getOrganizationSettings } from "@/lib/organization-settings";
import { SettingsForm } from "./_components/settings-form";

export default async function SettingsPage() {
  const settings = await getOrganizationSettings();
  return <section className="mx-auto max-w-5xl p-5 sm:p-8 lg:p-10">
    <header className="mb-8"><p className="mb-2 text-sm text-zinc-500">مدیریت سیستم / تنظیمات</p><h1 className="text-3xl font-bold tracking-tight">تنظیمات سازمان و ظاهر</h1><p className="mt-2 text-sm text-zinc-400">نام، لوگو، حالت نمایش و رنگ اصلی سامانه را مدیریت کنید.</p></header>
    <SettingsForm initialSettings={settings} />
  </section>;
}
