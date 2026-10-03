import Link from "next/link";

export default function AccessDeniedPage() {
  return <main dir="rtl" className="grid min-h-dvh place-items-center bg-zinc-950 p-6 text-zinc-100">
    <div className="max-w-md rounded-2xl border border-zinc-800 bg-zinc-900 p-8 text-center">
      <h1 className="text-2xl font-bold">دسترسی به این بخش مجاز نیست</h1>
      <p className="mt-3 text-sm leading-6 text-zinc-400">برای درخواست دسترسی، با مدیر سامانه تماس بگیرید.</p>
      <Link href="/" className="mt-6 inline-flex rounded-lg bg-zinc-100 px-4 py-2 text-sm font-semibold text-zinc-950">بازگشت</Link>
    </div>
  </main>;
}
