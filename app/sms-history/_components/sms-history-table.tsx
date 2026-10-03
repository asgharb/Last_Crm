"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import DatePicker, { type DatePickerRef } from "react-multi-date-picker";
import DateObject from "react-date-object";
import persian from "react-date-object/calendars/persian";
import persian_fa from "react-date-object/locales/persian_fa";
import gregorian from "react-date-object/calendars/gregorian";
import gregorian_fa from "react-date-object/locales/gregorian_fa";
import { CalendarDays, ChevronLeft, ChevronRight, MessageSquareText, Search, X } from "lucide-react";
import { toast } from "sonner";
import { listSmsHistory } from "@/lib/actions/sms-history";

type SmsHistoryRecord = {
  id: string;
  customerName: string;
  recipientMobile: string;
  templateName: string;
  body: string;
  provider: string;
  providerMessageId: string | null;
  providerStatus: string;
  providerStatusMessage: string | null;
  createdAt: Date;
};
type HistoryResult = { rows: SmsHistoryRecord[]; total: number; page: number; pageSize: number; pageCount: number };

const numberFormat = new Intl.NumberFormat("fa-IR");
const inputClass = "w-full rounded-lg border border-zinc-800 bg-zinc-950 py-2.5 text-sm text-zinc-100 outline-none transition focus:border-zinc-600 placeholder:text-zinc-600";
const persianDateTime = new Intl.DateTimeFormat("fa-IR-u-ca-persian", {
  timeZone: "Asia/Tehran",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
});

function toEnglishDigits(value: string) {
  return value.replace(/[\u0660-\u0669\u06F0-\u06F9]/g, (digit) => {
    const code = digit.charCodeAt(0);
    return String(code >= 0x06f0 ? code - 0x06f0 : code - 0x0660);
  });
}

function toPersianDate(value: string) {
  return new DateObject({ date: value, format: "YYYY-MM-DD", calendar: gregorian, locale: gregorian_fa })
    .convert(persian, persian_fa);
}

function statusPresentation(status: string) {
  const normalized = status.trim().toLowerCase().replace(/[ -]/g, "_");
  if (["delivered", "delivered_to_phone", "delivered_to_mobile", "success"].includes(normalized)) {
    return { label: "به گوشی رسید", className: "border-emerald-900 bg-emerald-950/50 text-emerald-300" };
  }
  if (["sent_to_operator", "delivered_to_operator", "accepted", "sent"].includes(normalized)) {
    return { label: "به مخابرات رسید", className: "border-sky-900 bg-sky-950/50 text-sky-300" };
  }
  if (["failed", "not_delivered", "undelivered", "rejected", "error"].includes(normalized)) {
    return { label: "نرسید", className: "border-red-900 bg-red-950/50 text-red-300" };
  }
  if (["queued", "pending", "processing"].includes(normalized)) {
    return { label: "در انتظار وضعیت", className: "border-amber-900 bg-amber-950/50 text-amber-300" };
  }
  return { label: status || "نامشخص", className: "border-zinc-700 bg-zinc-800 text-zinc-300" };
}

export function SmsHistoryTable({ initialResult }: { initialResult: HistoryResult }) {
  const [result, setResult] = useState(initialResult);
  const [query, setQuery] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [pending, startTransition] = useTransition();
  const datePickerRef = useRef<DatePickerRef | null>(null);
  const requestId = useRef(0);
  const skipInitialEffect = useRef(true);
  const from = result.total ? (result.page - 1) * result.pageSize + 1 : 0;
  const to = Math.min(result.page * result.pageSize, result.total);

  useEffect(() => {
    if (skipInitialEffect.current) {
      skipInitialEffect.current = false;
      return;
    }

    const timer = setTimeout(() => {
      const currentRequest = ++requestId.current;
      startTransition(async () => {
        try {
          const next = await listSmsHistory({ query, date: dateFilter, page, pageSize });
          if (currentRequest === requestId.current) setResult(next);
        } catch (error) {
          toast.error("دریافت تاریخچهٔ پیامک انجام نشد.", {
            description: error instanceof Error ? error.message : "لطفاً دوباره تلاش کنید.",
          });
        }
      });
    }, query ? 300 : 0);

    return () => clearTimeout(timer);
  }, [query, dateFilter, page, pageSize]);

  return (
    <>
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mb-2 text-sm text-zinc-500">مدیریت پیامک / تاریخچه</p>
          <h1 className="text-3xl font-bold tracking-tight">تاریخچهٔ پیامک‌ها</h1>
        </div>
      </header>

      <section className="mb-4 grid gap-3 rounded-2xl border border-zinc-800 bg-zinc-900/70 p-3 sm:grid-cols-[minmax(14rem,1fr)_minmax(12rem,16rem)_auto] sm:items-end sm:p-4">
        <label className="block min-w-0 text-xs text-zinc-400">جستجو بر اساس نام یا موبایل مشتری
          <span className="relative mt-1.5 block">
            <Search className="absolute right-3 top-1/2 size-4 -translate-y-1/2 text-zinc-500" />
            <input value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); }} placeholder="نام مشتری یا شماره موبایل" className={`${inputClass} pr-9 pl-3`} />
          </span>
        </label>
        <label className="block min-w-0 text-xs text-zinc-400">فیلتر تاریخ شمسی
          <span className="mt-1.5 flex items-center gap-2">
            <DatePicker
              ref={datePickerRef}
              value={dateFilter ? toPersianDate(dateFilter) : null}
              onChange={(date) => {
                setDateFilter(date ? toEnglishDigits(date.convert(gregorian, gregorian_fa).format("YYYY-MM-DD")) : "");
                setPage(1);
                datePickerRef.current?.closeCalendar();
              }}
              calendar={persian}
              locale={persian_fa}
              calendarPosition="bottom-right"
              format="YYYY/MM/DD"
              inputClass={`${inputClass} px-3`}
              containerClassName="min-w-0 flex-1"
              className="customer-date-picker"
              editable={false}
              zIndex={80}
            />
            {dateFilter ? (
              <button type="button" onClick={() => { setDateFilter(""); setPage(1); }} title="پاک کردن فیلتر تاریخ" aria-label="پاک کردن فیلتر تاریخ" className="rounded-lg border border-zinc-700 p-2.5 text-zinc-400 hover:bg-zinc-800 hover:text-white"><X className="size-4" /></button>
            ) : <CalendarDays className="pointer-events-none -mr-10 size-4 text-zinc-600" />}
          </span>
        </label>
        <div className="flex items-center justify-between gap-3 text-xs text-zinc-500 sm:justify-end">
          {pending && <span className="shrink-0 text-zinc-300">در حال جستجو...</span>}
        </div>
      </section>

      <section className={`overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/70 transition-opacity ${pending ? "opacity-60" : "opacity-100"}`}>
        <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-3">
          <h2 className="font-semibold">فهرست ارسال‌ها</h2>
          <span className="text-xs text-zinc-500">{numberFormat.format(result.total)} پیام</span>
        </div>
        {result.rows.length ? (
          <div className="w-full overflow-x-auto overscroll-x-contain">
            <table className="w-full min-w-[900px] table-fixed text-right text-xs sm:text-sm">
              <thead className="bg-zinc-950/70 text-xs text-zinc-500">
                <tr>
                  <th className="w-[17%] px-2 py-3 font-medium sm:w-[16%]">تاریخ ارسال</th>
                  <th className="w-[19%] px-2 py-3 font-medium">نام مشتری</th>
                  <th className="w-[18%] px-2 py-3 font-medium sm:w-[15%]">موبایل</th>
                  <th className="w-[15%] px-2 py-3 font-medium">قالب</th>
                  <th className="w-[17%] px-2 py-3 font-medium sm:w-[18%]">وضعیت درگاه</th>
                  <th className="w-[29%] px-2 py-3 font-medium sm:w-[21%]">متن پیام</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {result.rows.map((row) => {
                  const status = statusPresentation(row.providerStatus);
                  return (
                    <tr key={row.id} className="align-top hover:bg-zinc-800/30">
                      <td className="px-2 py-3 text-zinc-300">{persianDateTime.format(new Date(row.createdAt))}</td>
                      <td className="truncate px-2 py-3 font-medium text-zinc-200">{row.customerName}</td>
                      <td className="truncate px-2 py-3 text-zinc-300" dir="ltr">{row.recipientMobile}</td>
                      <td className="truncate px-2 py-3 text-zinc-400">{row.templateName}</td>
                      <td className="px-2 py-3">
                        <span className={`inline-flex max-w-full rounded-full border px-2 py-1 text-[10px] sm:text-xs ${status.className}`}>{status.label}</span>
                        {row.providerStatusMessage && <span className="mt-1 block break-words text-[10px] leading-4 text-zinc-500">{row.providerStatusMessage}</span>}
                      </td>
                      <td className="px-2 py-3"><p className="line-clamp-3 whitespace-pre-wrap break-words leading-5 text-zinc-400">{row.body}</p></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3 px-6 py-16 text-center text-sm text-zinc-500">
            <MessageSquareText className="size-8" />
            <p>{query || dateFilter ? "با این فیلترها پیامی پیدا نشد." : "هنوز پیامی در تاریخچه ثبت نشده است."}</p>
          </div>
        )}
        <footer className="flex flex-col gap-3 border-t border-zinc-800 px-4 py-3 text-xs text-zinc-500 sm:flex-row sm:items-center sm:justify-between">
          <span>نمایش {numberFormat.format(from)} تا {numberFormat.format(to)} از {numberFormat.format(result.total)} پیام</span>
          <div className="flex flex-wrap items-center gap-2">
            <label className="flex items-center gap-2">تعداد در صفحه
              <select value={pageSize} onChange={(event) => { setPageSize(Number(event.target.value)); setPage(1); }} className="rounded-md border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-zinc-200">
                {[10, 20, 50].map((size) => <option key={size} value={size}>{numberFormat.format(size)}</option>)}
              </select>
            </label>
            <button type="button" disabled={page <= 1 || pending} onClick={() => setPage((current) => current - 1)} aria-label="صفحهٔ قبل" className="rounded-md border border-zinc-700 p-1.5 text-zinc-300 hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-40"><ChevronRight className="size-4" /></button>
            <span className="min-w-16 text-center">صفحه {numberFormat.format(result.page)} از {numberFormat.format(result.pageCount)}</span>
            <button type="button" disabled={page >= result.pageCount || pending} onClick={() => setPage((current) => current + 1)} aria-label="صفحهٔ بعد" className="rounded-md border border-zinc-700 p-1.5 text-zinc-300 hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-40"><ChevronLeft className="size-4" /></button>
          </div>
        </footer>
      </section>
    </>
  );
}
