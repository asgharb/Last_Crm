import { Activity, Clock3, Database, MemoryStick, Server } from "lucide-react";
import { getServerHealth } from "@/lib/health";

function duration(seconds: number) { const days = Math.floor(seconds / 86400); const hours = Math.floor((seconds % 86400) / 3600); const minutes = Math.floor((seconds % 3600) / 60); return `${days} روز، ${hours} ساعت و ${minutes} دقیقه`; }

export const dynamic = "force-dynamic";
export default async function HealthPage() {
  const health = await getServerHealth();
  const cards = [
    { label: "وضعیت سرور", value: health.status === "healthy" ? "سالم" : "دارای خطا", icon: Server, good: health.status === "healthy" },
    { label: "پایگاه داده", value: health.database === "connected" ? `متصل (${health.databaseLatencyMs} ms)` : "قطع", icon: Database, good: health.database === "connected" },
    { label: "زمان فعالیت", value: duration(health.uptimeSeconds), icon: Clock3, good: true },
    { label: "حافظه مصرفی", value: `${health.memoryMb} MB`, icon: MemoryStick, good: true },
  ];
  return <section className="mx-auto max-w-5xl p-5 sm:p-8 lg:p-10"><header className="mb-8"><p className="mb-2 text-sm text-zinc-500">مدیریت سیستم / مانیتورینگ</p><h1 className="text-3xl font-bold tracking-tight">سلامت سرور</h1><p className="mt-2 text-sm text-zinc-400">وضعیت برنامه و اتصال پایگاه داده در لحظه بررسی می‌شود.</p></header>
    <div className="grid gap-4 sm:grid-cols-2">{cards.map(({label,value,icon:Icon,good}) => <div key={label} className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-5"><div className="flex items-center justify-between"><div className="grid size-11 place-items-center rounded-xl bg-zinc-800"><Icon className="size-5" /></div><span className={`size-2.5 rounded-full ${good ? "bg-emerald-400" : "bg-red-400"}`} /></div><div className="mt-5 text-sm text-zinc-400">{label}</div><div className="mt-1 text-lg font-semibold">{value}</div></div>)}</div>
    <div className="mt-5 flex items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 text-sm text-zinc-400"><Activity className="size-4" />آخرین بررسی: {new Intl.DateTimeFormat("fa-IR", { dateStyle: "medium", timeStyle: "medium" }).format(new Date(health.checkedAt))} · Node.js {health.nodeVersion}</div>
  </section>;
}
