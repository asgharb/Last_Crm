"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { authClient } from "@/lib/auth-client";
export function LoginForm() {
  const router = useRouter(); const [busy, setBusy] = useState(false);
  async function submit(form: FormData) {
    setBusy(true);
    try {
      const result = await authClient.signIn.username({ username: String(form.get("username")), password: String(form.get("password")) });
      if (result.error) {
        toast.error("ورود ناموفق بود", {
          description: result.error.message || "نام کاربری یا گذرواژه را بررسی کنید.",
        });
        return;
      }
      toast.success("خوش آمدید");
      router.replace("/");
      router.refresh();
    } catch (error) {
      toast.error("ارتباط با سرویس ورود برقرار نشد", {
        description: error instanceof Error ? error.message : "اتصال شبکه را بررسی کنید و دوباره تلاش کنید.",
      });
    } finally {
      setBusy(false);
    }
  }
  return <form action={submit} className="mx-auto w-full max-w-sm space-y-5 rounded-2xl border border-zinc-800/80 bg-zinc-950/45 p-6 shadow-xl shadow-black/10 sm:p-8"><div><h1 className="text-2xl font-bold">ورود به پنل</h1><p className="mt-2 text-sm text-zinc-400">برای ادامه، اطلاعات حساب خود را وارد کنید.</p></div><label className="block space-y-2 text-sm">نام کاربری<input name="username" type="text" autoComplete="username" minLength={3} maxLength={30} required className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2.5 outline-none transition focus:border-zinc-300 focus:ring-2 focus:ring-zinc-500/20" /></label><label className="block space-y-2 text-sm">گذرواژه<input name="password" type="password" autoComplete="current-password" required className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2.5 outline-none transition focus:border-zinc-300 focus:ring-2 focus:ring-zinc-500/20" /></label><button disabled={busy} className="w-full rounded-xl bg-zinc-100 px-4 py-3 font-semibold text-zinc-950 transition hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 disabled:cursor-not-allowed disabled:opacity-50">{busy ? "در حال ورود…" : "ورود"}</button></form>;
}
