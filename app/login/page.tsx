import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { ShieldCheck, Sparkles } from "lucide-react";
import { LoginForm } from "@/components/login-form";
import { getAccessibleModules } from "@/lib/permissions";
export default async function LoginPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (session) {
    if (session.user.role === "admin") redirect("/users");
    const modules = await getAccessibleModules(session.user.role ?? "user");
    redirect(modules.length ? ({ customers: "/customers", tags: "/tags", smsTemplates: "/sms-templates", smsHistory: "/sms-history", users: "/users", backup: "/backup" } as const)[modules[0]] : "/access-denied");
  }
  return (
    <main dir="rtl" className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-zinc-950 px-4 py-8 sm:px-6">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(161,161,170,0.13),transparent_48%),radial-gradient(ellipse_at_100%_100%,rgba(63,63,70,0.22),transparent_42%)]" />
      <div className="relative grid w-full max-w-5xl overflow-hidden rounded-[2rem] border border-zinc-800/90 bg-zinc-900/75 shadow-[0_32px_100px_-35px_rgba(0,0,0,0.8)] backdrop-blur-xl md:grid-cols-2">
    
        <aside className="relative hidden min-h-[560px] flex-col justify-between overflow-hidden border-r border-zinc-800 bg-gradient-to-br from-zinc-800/60 via-zinc-900 to-zinc-950 p-10 md:flex lg:p-12">
          <div aria-hidden="true" className="absolute inset-0 opacity-[0.12] [background-image:linear-gradient(to_right,#a1a1aa_1px,transparent_1px),linear-gradient(to_bottom,#a1a1aa_1px,transparent_1px)] [background-size:38px_38px] [mask-image:linear-gradient(to_bottom,black,transparent_82%)]" />
          <div aria-hidden="true" className="absolute -left-24 top-28 size-80 rounded-full border border-zinc-600/40" />
          <div aria-hidden="true" className="absolute -left-12 top-40 size-56 rounded-full border border-zinc-500/30" />
          <div aria-hidden="true" className="absolute left-10 top-52 size-32 rounded-full bg-zinc-100/[0.04] blur-2xl" />
          <div className="relative z-10 flex items-center gap-2 rounded-full border border-zinc-700/80 bg-zinc-950/40 px-3 py-1.5 text-xs text-zinc-300"><Sparkles className="size-3.5 text-zinc-400" />سامانهٔ یکپارچهٔ مدیریت</div>
          <div className="relative z-10 my-auto py-12">
            <div className="mb-6 grid size-16 place-items-center rounded-2xl border border-zinc-700 bg-zinc-800/80 text-zinc-100 shadow-xl shadow-black/20"><ShieldCheck className="size-7" /></div>
            <h2 className="max-w-sm text-3xl font-bold leading-[1.65] tracking-tight lg:text-4xl">همه‌چیز برای مدیریت بهتر، یک‌جا</h2>
            <p className="mt-4 max-w-sm text-sm leading-7 text-zinc-400">مشتریان، ارتباطات و اطلاعات سازمان را در محیطی امن و منظم مدیریت کنید.</p>
          </div>
          <div className="relative z-10 flex items-center gap-2 text-xs text-zinc-500"><span className="size-1.5 rounded-full bg-emerald-400" />محیط مدیریت امن و اختصاصی</div>
        </aside>

    <section className="flex flex-col justify-center px-6 py-9 sm:px-10 sm:py-12 lg:px-14" aria-label="ورود به سامانه">
          <div className="mb-9 flex items-center gap-3">
            <span className="grid size-11 place-items-center rounded-2xl border border-zinc-700 bg-zinc-800 text-zinc-100 shadow-inner"><ShieldCheck className="size-5" /></span>
            <div><p className="font-bold tracking-tight">پنل مدیریت</p><p className="mt-0.5 text-xs text-zinc-500">داشبورد سازمانی</p></div>
          </div>
          <LoginForm />
          <p className="mt-8 text-center text-xs text-zinc-600">دسترسی امن و یکپارچه به سامانهٔ مدیریت</p>
        </section>

      </div>
    </main>
  );
}
