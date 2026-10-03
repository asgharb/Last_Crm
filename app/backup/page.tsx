"use client";

import { useState } from "react";
import { Archive, Database, Download, FileUp, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

export default function BackupPage() {
  const [downloading, setDownloading] = useState(false);
  const [downloadingSql, setDownloadingSql] = useState(false);

  async function downloadBackup() {
    setDownloading(true);
    try {
      const response = await fetch("/api/backup");
      if (!response.ok) throw new Error("ساخت نسخهٔ پشتیبان انجام نشد.");
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `dashboard-backup-${new Date().toISOString().slice(0, 10)}.json`;
      link.click();
      URL.revokeObjectURL(url);
      toast.success("نسخهٔ پشتیبان دانلود شد.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "ساخت نسخهٔ پشتیبان انجام نشد.");
    } finally {
      setDownloading(false);
    }
  }

  function downloadSqlBackup() {
    setDownloadingSql(true);
    const form = document.createElement("form");
    form.method = "POST";
    form.action = "/api/backup/sql-server";
    form.target = "_blank";
    form.style.display = "none";
    document.body.appendChild(form);
    form.submit();
    form.remove();
    toast.info("تهیهٔ فایل پشتیبان SQL Server آغاز شد؛ دانلود پس از پایان عملیات شروع می‌شود.");
    window.setTimeout(() => setDownloadingSql(false), 5000);
  }

  return <section className="mx-auto max-w-4xl p-5 sm:p-8 lg:p-10">
    <header className="mb-8"><p className="mb-2 text-sm text-zinc-500">مدیریت سیستم / پشتیبان‌گیری</p><h1 className="text-3xl font-bold tracking-tight">پشتیبان‌گیری و بازیابی</h1><p className="mt-2 text-sm text-zinc-400">از اطلاعات سامانه نسخهٔ پشتیبان JSON دریافت کنید.</p></header>
    <div className="space-y-5 rounded-2xl border border-zinc-800 bg-zinc-900/70 p-5 sm:p-7">
      <div className="flex items-start gap-4"><div className="grid size-11 shrink-0 place-items-center rounded-xl bg-zinc-800 text-zinc-200"><Archive className="size-5" /></div><div><h2 className="font-semibold">ساخت نسخهٔ پشتیبان</h2><p className="mt-1 text-sm leading-6 text-zinc-400">اطلاعات کاربران و دسترسی‌ها، مشتریان، مدارک، برچسب‌ها و سوابق پیامک در یک فایل دانلود می‌شود.</p></div></div>
      <div className="flex flex-wrap gap-3">
      <button type="button" disabled={downloading} onClick={downloadBackup} className="inline-flex items-center gap-2 rounded-lg bg-zinc-100 px-4 py-2.5 text-sm font-semibold text-zinc-950 hover:bg-white disabled:opacity-50"><Download className="size-4" />{downloading ? "در حال آماده‌سازی..." : "دانلود نسخهٔ پشتیبان"}</button>
        <button type="button" disabled={downloadingSql} onClick={downloadSqlBackup} className="inline-flex items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-sm font-semibold text-zinc-100 transition hover:border-zinc-600 hover:bg-zinc-700 disabled:opacity-50"><Database className="size-4" />{downloadingSql ? "در حال آماده‌سازی فایل .bak..." : "دانلود نسخهٔ SQL Server (.bak)"}</button>
      </div>
      <div className="flex items-start gap-3 rounded-xl border border-amber-900/60 bg-amber-950/20 p-4 text-sm leading-6 text-amber-100"><ShieldCheck className="mt-0.5 size-4 shrink-0" /><p>فایل پشتیبان شامل اطلاعات حساس سامانه است. آن را در مکانی امن نگهداری کنید.</p></div>
      <div className="flex items-start gap-4 border-t border-zinc-800 pt-5"><div className="grid size-11 shrink-0 place-items-center rounded-xl bg-zinc-800 text-zinc-500"><FileUp className="size-5" /></div><div><h2 className="font-semibold text-zinc-400">بازیابی نسخهٔ پشتیبان</h2><p className="mt-1 text-sm leading-6 text-zinc-500">برای جلوگیری از جایگزینی ناخواستهٔ اطلاعات فعلی، بازیابی کامل پس از تعیین روش بازیابی فعال می‌شود.</p></div></div>
    </div>
  </section>;
}
