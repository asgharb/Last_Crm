"use client";

import { useRef, useTransition } from "react";
import { KeyRound } from "lucide-react";
import { toast } from "sonner";
import { changeOwnPassword } from "@/lib/actions/account";

export function PasswordForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [pending, startTransition] = useTransition();

  function submit(formData: FormData) {
    startTransition(async () => {
      try {
        await changeOwnPassword({
          currentPassword: formData.get("currentPassword"),
          newPassword: formData.get("newPassword"),
          confirmPassword: formData.get("confirmPassword"),
        });
        formRef.current?.reset();
        toast.success("گذرواژه شما تغییر کرد.", { description: "نشست‌های دیگر حساب بسته شدند." });
      } catch (error) {
        toast.error("تغییر گذرواژه انجام نشد.", { description: error instanceof Error ? error.message : "اطلاعات واردشده را بررسی کنید." });
      }
    });
  }

  return <form ref={formRef} action={submit} className="max-w-xl space-y-5 rounded-2xl border border-zinc-800 bg-zinc-900/70 p-5 sm:p-7">
    <div className="flex items-start gap-3"><div className="grid size-11 place-items-center rounded-xl bg-zinc-800 text-zinc-200"><KeyRound className="size-5" /></div><div><h2 className="font-semibold">تغییر گذرواژه</h2><p className="mt-1 text-sm text-zinc-400">برای امنیت حساب، گذرواژه فعلی و گذرواژه جدید را وارد کنید.</p></div></div>
    <label className="block text-sm text-zinc-300">گذرواژه فعلی<input name="currentPassword" type="password" autoComplete="current-password" required className="mt-1.5 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2.5 outline-none focus:border-zinc-500" /></label>
    <label className="block text-sm text-zinc-300">گذرواژه جدید<input name="newPassword" type="password" autoComplete="new-password" required minLength={12} className="mt-1.5 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2.5 outline-none focus:border-zinc-500" /><span className="mt-1 block text-xs text-zinc-500">حداقل ۱۲ نویسه</span></label>
    <label className="block text-sm text-zinc-300">تکرار گذرواژه جدید<input name="confirmPassword" type="password" autoComplete="new-password" required minLength={12} className="mt-1.5 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2.5 outline-none focus:border-zinc-500" /></label>
    <div className="flex justify-end border-t border-zinc-800 pt-5"><button disabled={pending} className="rounded-lg bg-zinc-100 px-5 py-2.5 text-sm font-semibold text-zinc-950 hover:bg-white disabled:opacity-50">{pending ? "در حال تغییر..." : "تغییر گذرواژه"}</button></div>
  </form>;
}
