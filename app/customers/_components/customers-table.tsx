"use client";

import { useEffect, useMemo, useRef, useState, useTransition, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Check, ChevronLeft, ChevronRight, ContactRound, Download, FileText, MessageSquareText, Pencil, Plus, Power, Search, Send, Trash2, Upload,
} from "lucide-react";
import { toast } from "sonner";
import DatePicker, { type DatePickerRef } from "react-multi-date-picker";
import DateObject from "react-date-object";
import persian from "react-date-object/calendars/persian";
import persian_fa from "react-date-object/locales/persian_fa";
import gregorian from "react-date-object/calendars/gregorian";
import gregorian_fa from "react-date-object/locales/gregorian_fa";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import {
  createCustomer, setCustomerActive, softDeleteCustomer, updateCustomer,
} from "@/lib/actions/customers";
import { sendSmsBatch } from "@/lib/actions/sms-send";

type Customer = {
  id: string;
  customerCode: number;
  firstName: string;
  lastName: string;
  nationalCode: string;
  mobile: string;
  telephone: string | null;
  economicCode: string | null;
  gender: string | null;
  fatherName: string | null;
  birthDate: Date | null;
  province: string | null;
  city: string | null;
  address: string | null;
  maritalStatus: string | null;
  customerClass: string;
  tags: { tag: { id: string; name: string; color: string } }[];
  isActive: boolean;
  createdAt: Date;
};

type CustomerDraft = {
  firstName: string;
  lastName: string;
  nationalCode: string;
  mobile: string;
  telephone: string;
  economicCode: string;
  gender: "" | "male" | "female" | "other";
  fatherName: string;
  birthDate: string;
  province: string;
  city: string;
  address: string;
  maritalStatus: "" | "single" | "married" | "divorced" | "widowed";
  customerClass: "bankdar" | "wholesaler" | "retailer";
  tagIds: string[];
};

type SmsTemplateOption = { id: string; name: string; content: string };

const blankDraft: CustomerDraft = {
  firstName: "", lastName: "", nationalCode: "", mobile: "", telephone: "",
  economicCode: "", gender: "", fatherName: "", birthDate: "", province: "",
  city: "", address: "", maritalStatus: "", customerClass: "retailer", tagIds: [],
};

const inputClass = "mt-1.5 w-full min-w-0 rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2.5 text-sm outline-none transition focus:border-zinc-500 placeholder:text-zinc-600";
const labelClass = "block min-w-0 text-sm text-zinc-300";
const numberFormat = new Intl.NumberFormat("fa-IR");
const customerClassLabels: Record<string, string> = {
  bankdar: "بنکدار",
  wholesaler: "عمده‌فروش",
  retailer: "خرده‌فروش",
};

function toPersianDate(value: string) {
  return new DateObject({
    date: value,
    format: "YYYY-MM-DD",
    calendar: gregorian,
    locale: gregorian_fa,
  }).convert(persian, persian_fa);
}

function errorToast(error: unknown) {
  toast.error("عملیات مشتری انجام نشد.", {
    description: error instanceof Error ? error.message : "لطفاً دوباره تلاش کنید.",
  });
}

export function CustomersTable({ initialCustomers, availableTags, smsTemplates, canManageDocuments }: { initialCustomers: Customer[]; availableTags: { id: string; name: string; color: string }[]; smsTemplates: SmsTemplateOption[]; canManageDocuments: boolean }) {
  const router = useRouter();
  const [customers, setCustomers] = useState(initialCustomers);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [open, setOpen] = useState(false);
  const [smsDialogOpen, setSmsDialogOpen] = useState(false);
  const [documentsOpen, setDocumentsOpen] = useState(false);
  const [documentsCustomer, setDocumentsCustomer] = useState<Customer | null>(null);
  const [documents, setDocuments] = useState<{ id: string; fileName: string; size: number; createdAt: string }[]>([]);
  const [documentsLoading, setDocumentsLoading] = useState(false);
  const [documentsBusy, setDocumentsBusy] = useState(false);
  const [documentsReload, setDocumentsReload] = useState(0);
  const [documentFiles, setDocumentFiles] = useState<File[]>([]);
  const [selectedCustomerIds, setSelectedCustomerIds] = useState<Set<string>>(() => new Set());
  const [smsTemplateId, setSmsTemplateId] = useState(smsTemplates[0]?.id ?? "");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState(blankDraft);
  const [pending, startTransition] = useTransition();
  const birthDatePickerRef = useRef<DatePickerRef | null>(null);

  const filteredCustomers = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase("fa");
    if (!normalized) return customers;
    return customers.filter((customer) =>
      [customer.customerCode, customer.firstName, customer.lastName, customer.nationalCode, customer.mobile, customer.province, customer.city, customer.customerClass, ...customer.tags.map(({ tag }) => tag.name)]
        .join(" ").toLocaleLowerCase("fa").includes(normalized),
    );
  }, [customers, query]);

  const pageCount = Math.max(1, Math.ceil(filteredCustomers.length / pageSize));
  const pageCustomers = filteredCustomers.slice((page - 1) * pageSize, page * pageSize);
  const selectablePageIds = pageCustomers.filter((customer) => customer.isActive).map((customer) => customer.id);
  const allSelectablePageSelected = selectablePageIds.length > 0 && selectablePageIds.every((id) => selectedCustomerIds.has(id));
  const selectedCustomers = customers.filter((customer) => selectedCustomerIds.has(customer.id));
  const selectedSmsTemplate = smsTemplates.find((template) => template.id === smsTemplateId);

  useEffect(() => {
    setPage((current) => Math.min(current, pageCount));
  }, [pageCount]);

  useEffect(() => {
    setCustomers(initialCustomers);
  }, [initialCustomers]);

  useEffect(() => {
    if (!documentsOpen || !documentsCustomer) return;
    const controller = new AbortController();
    setDocumentsLoading(true);
    fetch(`/api/customers/${documentsCustomer.id}/documents`, { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error("دریافت فهرست مدارک ناموفق بود.");
        setDocuments(await response.json());
      })
      .catch((error) => { if (error.name !== "AbortError") toast.error(error.message); })
      .finally(() => { if (!controller.signal.aborted) setDocumentsLoading(false); });
    return () => controller.abort();
  }, [documentsOpen, documentsCustomer, documentsReload]);

  function openDocuments(customer: Customer) {
    setDocumentsCustomer(customer);
    setDocumentFiles([]);
    setDocumentsOpen(true);
  }

  async function uploadDocuments() {
    if (!documentsCustomer || !documentFiles.length) return;
    setDocumentsBusy(true);
    try {
      const formData = new FormData();
      documentFiles.forEach((file) => formData.append("files", file));
      const response = await fetch(`/api/customers/${documentsCustomer.id}/documents`, { method: "POST", body: formData });
      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error ?? "بارگذاری مدارک ناموفق بود.");
      }
      setDocumentFiles([]);
      setDocumentsReload((value) => value + 1);
      toast.success("مدارک بارگذاری شد.");
    } catch (error) { toast.error(error instanceof Error ? error.message : "بارگذاری مدارک ناموفق بود."); }
    finally { setDocumentsBusy(false); }
  }

  async function removeDocument(documentId: string) {
    if (!documentsCustomer) return;
    setDocumentsBusy(true);
    try {
      const response = await fetch(`/api/customers/${documentsCustomer.id}/documents/${documentId}`, { method: "DELETE" });
      if (!response.ok) throw new Error("حذف مدرک ناموفق بود.");
      setDocumentsReload((value) => value + 1);
      toast.success("مدرک حذف شد.");
    } catch (error) { toast.error(error instanceof Error ? error.message : "حذف مدرک ناموفق بود."); }
    finally { setDocumentsBusy(false); }
  }

  function updateDraft<K extends keyof CustomerDraft>(key: K, value: CustomerDraft[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  function openCreate() {
    setEditingId(null);
    setDraft(blankDraft);
    setOpen(true);
  }

  function openEdit(customer: Customer) {
    setEditingId(customer.id);
    setDraft({
      firstName: customer.firstName,
      lastName: customer.lastName,
      nationalCode: customer.nationalCode,
      mobile: customer.mobile,
      telephone: customer.telephone ?? "",
      economicCode: customer.economicCode ?? "",
      gender: (customer.gender as CustomerDraft["gender"]) ?? "",
      fatherName: customer.fatherName ?? "",
      birthDate: customer.birthDate ? new Date(customer.birthDate).toISOString().slice(0, 10) : "",
      province: customer.province ?? "",
      city: customer.city ?? "",
      address: customer.address ?? "",
      maritalStatus: (customer.maritalStatus as CustomerDraft["maritalStatus"]) ?? "",
      customerClass: customer.customerClass as CustomerDraft["customerClass"],
      tagIds: customer.tags.map(({ tag }) => tag.id),
    });
    setOpen(true);
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    startTransition(async () => {
      try {
        if (editingId) {
          await updateCustomer(editingId, draft);
          toast.success("اطلاعات مشتری ویرایش شد.");
        } else {
          const result = await createCustomer(draft);
          toast.success(`مشتری با کد ${numberFormat.format(result.customerCode)} ثبت شد.`);
        }
        setOpen(false);
        router.refresh();
      } catch (error) {
        errorToast(error);
      }
    });
  }

  function toggleActive(customer: Customer) {
    startTransition(async () => {
      try {
        const isActive = !customer.isActive;
        await setCustomerActive(customer.id, isActive);
        setCustomers((rows) => rows.map((row) => row.id === customer.id ? { ...row, isActive } : row));
        if (!isActive) setSelectedCustomerIds((current) => {
          const next = new Set(current);
          next.delete(customer.id);
          return next;
        });
        toast.success(isActive ? "مشتری فعال شد." : "مشتری غیرفعال شد.");
      } catch (error) {
        errorToast(error);
      }
    });
  }

  function deleteCustomer(customer: Customer) {
    startTransition(async () => {
      try {
        await softDeleteCustomer(customer.id);
        setCustomers((rows) => rows.filter((row) => row.id !== customer.id));
        setSelectedCustomerIds((current) => {
          const next = new Set(current);
          next.delete(customer.id);
          return next;
        });
        toast.warning("مشتری حذف شد.", { description: "حذف به‌صورت نرم‌افزاری انجام شد." });
      } catch (error) {
        errorToast(error);
      }
    });
  }

  function toggleCustomerSelection(id: string, checked: boolean) {
    setSelectedCustomerIds((current) => {
      const next = new Set(current);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  function togglePageSelection(checked: boolean) {
    setSelectedCustomerIds((current) => {
      const next = new Set(current);
      for (const id of selectablePageIds) {
        if (checked) next.add(id);
        else next.delete(id);
      }
      return next;
    });
  }

  function sendSelectedSms() {
    if (selectedCustomerIds.size > 100) {
      toast.error("در هر نوبت حداکثر ۱۰۰ مشتری را انتخاب کنید.");
      return;
    }
    if (!smsTemplateId) {
      toast.error("قالب فعالی برای ارسال وجود ندارد.", { description: "ابتدا از بخش قالب‌های پیامک، یک قالب فعال بسازید." });
      return;
    }

    startTransition(async () => {
      try {
        const result = await sendSmsBatch({ customerIds: [...selectedCustomerIds], templateId: smsTemplateId });
        const summary = `${numberFormat.format(result.sent)} پیام پردازش شد و ${numberFormat.format(result.failed)} پیام ناموفق بود.`;
        if (result.simulated) {
          toast.warning("ارسال پیامک شبیه‌سازی شد.", {
            description: `${summary} درگاه واقعی هنوز پیکربندی نشده است.`,
          });
        } else if (result.failed) {
          toast.warning("ارسال پیامک با خطاهایی همراه بود.", { description: summary });
        } else {
          toast.success("پیامک‌ها ارسال شدند.", { description: summary });
        }
        setSelectedCustomerIds(new Set());
        setSmsDialogOpen(false);
      } catch (error) {
        errorToast(error);
      }
    });
  }

  const from = filteredCustomers.length ? (page - 1) * pageSize + 1 : 0;
  const to = Math.min(page * pageSize, filteredCustomers.length);

  return (
    <>
      <div className="mb-4 flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full min-w-0 sm:max-w-sm sm:flex-1">
          <Search className="absolute right-3 top-1/2 size-4 -translate-y-1/2 text-zinc-500" />
          <input value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); }}
            placeholder="جست‌وجو در نام، کد مشتری یا موبایل" aria-label="جست‌وجوی مشتریان"
            className="w-full rounded-lg border border-zinc-800 bg-zinc-900 py-2.5 pl-3 pr-9 text-sm outline-none focus:border-zinc-600" />
        </div>
        <div className="grid w-full grid-cols-2 gap-2 sm:w-auto sm:flex sm:shrink-0">
          <button type="button" disabled={!selectedCustomerIds.size} onClick={() => setSmsDialogOpen(true)} title={selectedCustomerIds.size > 100 ? "حداکثر ۱۰۰ مشتری در هر نوبت قابل انتخاب است" : undefined} className="inline-flex min-w-0 items-center justify-center gap-2 whitespace-nowrap rounded-lg border border-zinc-700 bg-zinc-900 px-2 py-2.5 text-xs font-semibold text-zinc-200 transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-40 sm:px-4 sm:text-sm">
            <MessageSquareText className="size-4" /> ارسال پیامک
            {selectedCustomerIds.size > 0 && <span className="rounded-full bg-zinc-700 px-1.5 py-0.5 text-xs">{numberFormat.format(selectedCustomerIds.size)}</span>}
          </button>
          <button type="button" onClick={openCreate} className="inline-flex min-w-0 items-center justify-center gap-2 whitespace-nowrap rounded-lg bg-zinc-100 px-2 py-2.5 text-xs font-semibold text-zinc-950 transition hover:bg-white sm:px-4 sm:text-sm">
            <Plus className="size-4" /> مشتری جدید
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/70">
        <div className="w-full overflow-x-auto overscroll-x-contain">
          <table className="w-full min-w-[900px] table-fixed text-right text-xs sm:text-sm">
            <thead className="bg-zinc-950/70 text-xs text-zinc-500">
              <tr>
                <th className="w-10 px-1 py-3 text-center font-medium"><input type="checkbox" checked={allSelectablePageSelected} onChange={(event) => togglePageSelection(event.target.checked)} aria-label="انتخاب مشتریان فعال این صفحه" className="size-4 accent-zinc-100" /></th>
                <th className="w-[6%] px-1 py-3 font-medium">ردیف</th>
                <th className="w-[12%] px-1 py-3 font-medium sm:w-[10%] md:w-[9%] lg:w-[8%]">کد مشتری</th>
                <th className="w-[26%] px-1 py-3 font-medium sm:w-[20%] md:w-[17%] lg:w-[14%]">نام مشتری</th>
                <th className="w-[12%] px-2 py-3 font-medium">طبقه مشتری</th>
                <th className="w-[18%] px-2 py-3 font-medium">تگ‌ها</th>
                <th className="w-[25%] px-1 py-3 font-medium sm:w-[20%] md:w-[17%] lg:w-[13%]">موبایل</th>
                <th className="w-[9%] px-2 py-3 font-medium">وضعیت</th>
                <th className="w-[31%] px-1 py-3 text-center font-medium sm:w-[34%] md:w-[27%] lg:w-[17%]">عملیات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {pageCustomers.map((customer, index) => (
                <tr key={customer.id} className="hover:bg-zinc-800/30">
                  <td className="px-1 py-4 text-center"><input type="checkbox" checked={selectedCustomerIds.has(customer.id)} disabled={!customer.isActive} onChange={(event) => toggleCustomerSelection(customer.id, event.target.checked)} aria-label={`انتخاب ${customer.firstName} ${customer.lastName}`} className="size-4 accent-zinc-100 disabled:cursor-not-allowed disabled:opacity-30" /></td>
                  <td className="px-1 py-4 text-zinc-500 sm:px-3">{numberFormat.format((page - 1) * pageSize + index + 1)}</td>
                  <td className="truncate px-1 py-4 font-semibold text-zinc-200 sm:px-3">{numberFormat.format(customer.customerCode)}</td>
                  <td className="truncate px-1 py-4 font-medium sm:px-3">{customer.firstName} {customer.lastName}</td>
                  <td className="truncate px-2 py-4 text-zinc-300">{customerClassLabels[customer.customerClass]}</td>
                  <td className="px-2 py-4">
                    <div className="flex flex-wrap gap-1">
                      {customer.tags.length ? customer.tags.slice(0, 3).map(({ tag }) => (
                        <span key={tag.id} className="inline-flex max-w-full items-center gap-1 rounded-full border border-zinc-700 px-2 py-0.5 text-[11px] text-zinc-300">
                          <span className="size-1.5 shrink-0 rounded-full" style={{ backgroundColor: tag.color }} />
                          <span className="truncate">{tag.name}</span>
                        </span>
                      )) : <span className="text-zinc-600">—</span>}
                      {customer.tags.length > 3 && <span className="text-xs text-zinc-500">+{numberFormat.format(customer.tags.length - 3)}</span>}
                    </div>
                  </td>
                  <td className="truncate px-1 py-4 text-zinc-300 sm:px-3" dir="ltr">{customer.mobile}</td>
                  <td className="px-2 py-4">
                    <span className={`inline-flex items-center gap-1.5 text-xs ${customer.isActive ? "text-emerald-400" : "text-zinc-500"}`}>
                      <span className={`size-1.5 rounded-full ${customer.isActive ? "bg-emerald-400" : "bg-zinc-600"}`} />
                      {customer.isActive ? "فعال" : "غیرفعال"}
                    </span>
                  </td>
                  <td className="px-1 py-3 sm:px-2">
                    <div className="flex items-center justify-center gap-0.5 sm:gap-1">
                      <button type="button" disabled={pending} onClick={() => toggleActive(customer)}
                        title={customer.isActive ? "غیرفعال کردن" : "فعال کردن"} aria-label={customer.isActive ? "غیرفعال کردن مشتری" : "فعال کردن مشتری"}
                        className={`rounded-md p-1.5 transition hover:bg-zinc-800 disabled:opacity-50 ${customer.isActive ? "text-amber-400" : "text-emerald-400"}`}>
                        <Power className="size-4" />
                      </button>
                      <button type="button" disabled={pending} onClick={() => openEdit(customer)} title="ویرایش" aria-label="ویرایش مشتری"
                        className="rounded-md p-1.5 text-zinc-400 transition hover:bg-zinc-800 hover:text-white disabled:opacity-50">
                        <Pencil className="size-4" />
                      </button>
                      {canManageDocuments && <button type="button" onClick={() => openDocuments(customer)} title="مدارک مشتری" aria-label={`مدارک ${customer.firstName} ${customer.lastName}`} className="rounded-md p-1.5 text-sky-400 transition hover:bg-zinc-800 hover:text-sky-300">
                        <FileText className="size-4" />
                      </button>}
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <button type="button" disabled={pending} title="حذف" aria-label="حذف مشتری"
                            className="rounded-md p-1.5 text-red-400 transition hover:bg-red-950 hover:text-red-300 disabled:opacity-50">
                            <Trash2 className="size-4" />
                          </button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogTitle className="text-lg font-bold">حذف مشتری</AlertDialogTitle>
                          <AlertDialogDescription className="mt-2 text-sm text-zinc-400">
                            مشتری «{customer.firstName} {customer.lastName}» حذف شود؟
                          </AlertDialogDescription>
                          <div className="mt-6 flex justify-start gap-2">
                            <AlertDialogCancel className="rounded-lg border border-zinc-700 px-4 py-2 text-sm">انصراف</AlertDialogCancel>
                            <AlertDialogAction onClick={() => deleteCustomer(customer)} className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold hover:bg-red-500">حذف مشتری</AlertDialogAction>
                          </div>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {pageCustomers.length === 0 && (
          <div className="flex flex-col items-center gap-2 py-14 text-sm text-zinc-500">
            <ContactRound className="size-7" /> مشتری‌ای پیدا نشد.
          </div>
        )}

        <div className="flex flex-col gap-3 border-t border-zinc-800 px-4 py-3 text-xs text-zinc-500 sm:flex-row sm:items-center sm:justify-between">
          <span>نمایش {numberFormat.format(from)} تا {numberFormat.format(to)} از {numberFormat.format(filteredCustomers.length)} مشتری</span>
          <div className="flex flex-wrap items-center gap-2">
            <label className="flex items-center gap-2">تعداد در صفحه
              <select value={pageSize} onChange={(event) => { setPageSize(Number(event.target.value)); setPage(1); }}
                className="rounded-md border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-zinc-200">
                {[10, 20, 50].map((size) => <option key={size} value={size}>{numberFormat.format(size)}</option>)}
              </select>
            </label>
            <button type="button" disabled={page <= 1} onClick={() => setPage((current) => current - 1)} aria-label="صفحه قبلی"
              className="rounded-md border border-zinc-700 p-1.5 text-zinc-300 hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-40">
              <ChevronRight className="size-4" />
            </button>
            <span className="min-w-16 text-center">صفحه {numberFormat.format(page)} از {numberFormat.format(pageCount)}</span>
            <button type="button" disabled={page >= pageCount} onClick={() => setPage((current) => current + 1)} aria-label="صفحه بعدی"
              className="rounded-md border border-zinc-700 p-1.5 text-zinc-300 hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-40">
              <ChevronLeft className="size-4" />
            </button>
          </div>
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[calc(100dvh-2rem)] max-w-3xl overflow-y-auto overflow-x-hidden">
          <DialogTitle>{editingId ? "ویرایش مشتری" : "ثبت مشتری جدید"}</DialogTitle>
          <DialogDescription>اطلاعات مشتری را وارد کنید. کد مشتری به‌صورت خودکار توسط پایگاه داده ساخته می‌شود.</DialogDescription>
          <form onSubmit={submit} className="mt-5 space-y-5">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <label className={labelClass}>نام *<input required maxLength={100} value={draft.firstName} onChange={(e) => updateDraft("firstName", e.target.value)} className={inputClass} /></label>
              <label className={labelClass}>نام خانوادگی *<input required maxLength={100} value={draft.lastName} onChange={(e) => updateDraft("lastName", e.target.value)} className={inputClass} /></label>
              <label className={labelClass}>کد ملی *<input required inputMode="numeric" maxLength={10} value={draft.nationalCode} onChange={(e) => updateDraft("nationalCode", e.target.value)} className={inputClass} dir="ltr" /></label>
              <label className={labelClass}>موبایل *<input required type="tel" inputMode="tel" maxLength={11} placeholder="09123456789" value={draft.mobile} onChange={(e) => updateDraft("mobile", e.target.value)} className={inputClass} dir="ltr" /></label>
              <label className={labelClass}>تلفن ثابت<input type="tel" maxLength={20} value={draft.telephone} onChange={(e) => updateDraft("telephone", e.target.value)} className={inputClass} dir="ltr" /></label>
              <label className={labelClass}>کد اقتصادی<input maxLength={32} value={draft.economicCode} onChange={(e) => updateDraft("economicCode", e.target.value)} className={inputClass} dir="ltr" /></label>
              <label className={labelClass}>طبقه مشتری
                <select value={draft.customerClass} onChange={(e) => updateDraft("customerClass", e.target.value as CustomerDraft["customerClass"])} className={inputClass}>
                  <option value="bankdar">بنکدار</option><option value="wholesaler">عمده‌فروش</option><option value="retailer">خرده‌فروش</option>
                </select>
              </label>
              <label className={labelClass}>جنسیت<select value={draft.gender} onChange={(e) => updateDraft("gender", e.target.value as CustomerDraft["gender"])} className={inputClass}><option value="">انتخاب کنید</option><option value="female">زن</option><option value="male">مرد</option><option value="other">سایر</option></select></label>
              <label className={labelClass}>نام پدر<input maxLength={100} value={draft.fatherName} onChange={(e) => updateDraft("fatherName", e.target.value)} className={inputClass} /></label>
              <label className={labelClass}>تاریخ تولد
                <DatePicker
                  ref={birthDatePickerRef}
                  value={draft.birthDate ? toPersianDate(draft.birthDate) : null}
                  onChange={(date) => {
                    updateDraft("birthDate", date ? date.convert(gregorian, gregorian_fa).format("YYYY-MM-DD") : "");
                    birthDatePickerRef.current?.closeCalendar();
                  }}
                  calendar={persian}
                  locale={persian_fa}
                  calendarPosition="bottom-right"
                  format="YYYY/MM/DD"
                  inputClass={inputClass}
                  containerClassName="mt-1.5 w-full"
                  className="customer-date-picker"
                  editable={false}
                  zIndex={80}
                />
              </label>
              <label className={labelClass}>استان<input maxLength={100} value={draft.province} onChange={(e) => updateDraft("province", e.target.value)} className={inputClass} /></label>
              <label className={labelClass}>شهر<input maxLength={100} value={draft.city} onChange={(e) => updateDraft("city", e.target.value)} className={inputClass} /></label>
              <label className={labelClass}>وضعیت تأهل<select value={draft.maritalStatus} onChange={(e) => updateDraft("maritalStatus", e.target.value as CustomerDraft["maritalStatus"])} className={inputClass}><option value="">انتخاب کنید</option><option value="single">مجرد</option><option value="married">متأهل</option><option value="divorced">مطلقه</option><option value="widowed">همسر فوت‌شده</option></select></label>
              <div className="rounded-xl border border-zinc-800 bg-zinc-950/50 p-3 sm:col-span-2">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <span className="text-sm text-zinc-300">تگ‌های مشتری</span>
                  <Link href="/tags" className="text-xs text-zinc-400 underline-offset-4 hover:text-white hover:underline">مدیریت تگ‌ها</Link>
                </div>
                {availableTags.length ? (
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {availableTags.map((tag) => (
                      <label key={tag.id} className="flex min-w-0 cursor-pointer items-center gap-2 rounded-lg border border-zinc-800 px-2.5 py-2 text-sm text-zinc-300 hover:bg-zinc-900">
                        <input type="checkbox" checked={draft.tagIds.includes(tag.id)}
                          onChange={(event) => updateDraft("tagIds", event.target.checked ? [...draft.tagIds, tag.id] : draft.tagIds.filter((id) => id !== tag.id))}
                          className="accent-zinc-100" />
                        <span className="size-2 shrink-0 rounded-full" style={{ backgroundColor: tag.color }} />
                        <span className="truncate">{tag.name}</span>
                      </label>
                    ))}
                  </div>
                ) : <p className="text-xs text-zinc-500">هنوز تگی ساخته نشده است.</p>}
              </div>
              <label className={`${labelClass} sm:col-span-2`}>آدرس<textarea rows={3} maxLength={4000} value={draft.address} onChange={(e) => updateDraft("address", e.target.value)} className={`${inputClass} resize-y`} /></label>
            </div>
            <div className="flex justify-start gap-2 border-t border-zinc-800 pt-4">
              <button type="button" onClick={() => setOpen(false)} className="rounded-lg border border-zinc-700 px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-800">انصراف</button>
              <button disabled={pending} className="rounded-lg bg-zinc-100 px-4 py-2 text-sm font-semibold text-zinc-950 hover:bg-white disabled:opacity-50">{pending ? "در حال ذخیره…" : editingId ? "ذخیره تغییرات" : "ثبت مشتری"}</button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
      <Dialog open={documentsOpen} onOpenChange={setDocumentsOpen}>
        <DialogContent className="max-h-[calc(100dvh-2rem)] max-w-xl overflow-y-auto">
          <DialogTitle>مدارک {documentsCustomer?.firstName} {documentsCustomer?.lastName}</DialogTitle>
          <DialogDescription>فایل‌های پرونده مشتری را بارگذاری، دریافت یا حذف کنید. هر فایل حداکثر ۱۰ مگابایت باشد.</DialogDescription>
          <div className="mt-4 space-y-4">
            <div className="rounded-xl border border-zinc-800 bg-zinc-950/50 p-3">
              <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-zinc-700 px-4 py-5 text-sm text-zinc-300 hover:bg-zinc-900">
                <Upload className="size-4" /> انتخاب مدارک
                <input type="file" multiple className="sr-only" onChange={(event) => setDocumentFiles(Array.from(event.target.files ?? []))} />
              </label>
              {documentFiles.length > 0 && <div className="mt-3 space-y-1 text-xs text-zinc-400">{documentFiles.map((file, index) => <p key={`${file.name}-${index}`} className="truncate">{file.name}</p>)}</div>}
              <button type="button" disabled={!documentFiles.length || documentsBusy} onClick={uploadDocuments} className="mt-3 inline-flex items-center gap-2 rounded-lg bg-zinc-100 px-3 py-2 text-sm font-semibold text-zinc-950 disabled:opacity-50">
                <Upload className="size-4" /> {documentsBusy ? "در حال بارگذاری..." : "بارگذاری فایل‌های انتخاب‌شده"}
              </button>
            </div>
            <div>
              <h3 className="mb-2 text-sm font-semibold text-zinc-200">مدارک قبلی</h3>
              {documentsLoading ? <p className="py-4 text-center text-sm text-zinc-500">در حال دریافت...</p> : documents.length ? (
                <ul className="divide-y divide-zinc-800 rounded-xl border border-zinc-800">
                  {documents.map((document) => <li key={document.id} className="flex items-center gap-2 p-3">
                    <FileText className="size-4 shrink-0 text-zinc-500" />
                    <span className="min-w-0 flex-1 truncate text-sm text-zinc-300" title={document.fileName}>{document.fileName}</span>
                    <a href={`/api/customers/${documentsCustomer?.id}/documents/${document.id}`} title="دانلود" aria-label={`دانلود ${document.fileName}`} className="rounded-md p-2 text-sky-400 hover:bg-zinc-800"><Download className="size-4" /></a>
                    <button type="button" disabled={documentsBusy} onClick={() => removeDocument(document.id)} title="حذف" aria-label={`حذف ${document.fileName}`} className="rounded-md p-2 text-red-400 hover:bg-red-950 disabled:opacity-50"><Trash2 className="size-4" /></button>
                  </li>)}
                </ul>
              ) : <p className="rounded-lg border border-zinc-800 px-3 py-5 text-center text-sm text-zinc-500">مدرکی ثبت نشده است.</p>}
            </div>
          </div>
        </DialogContent>
      </Dialog>
      <Dialog open={smsDialogOpen} onOpenChange={setSmsDialogOpen}>
        <DialogContent className="max-h-[calc(100dvh-2rem)] max-w-xl overflow-y-auto overflow-x-hidden">
          <DialogTitle>ارسال پیامک به مشتریان</DialogTitle>
          <DialogDescription>
            برای {numberFormat.format(selectedCustomers.length)} مشتری پیام جداگانه ساخته می‌شود؛ کلیدواژه‌ها برای هر مشتری با اطلاعات پروندهٔ خودش جایگزین می‌شوند.
          </DialogDescription>
          <div className="mt-4 space-y-4">
            <label className={labelClass}>قالب پیامک
              <select value={smsTemplateId} onChange={(event) => setSmsTemplateId(event.target.value)} className={inputClass}>
                {smsTemplates.map((template) => <option key={template.id} value={template.id}>{template.name}</option>)}
              </select>
            </label>
            {selectedSmsTemplate ? (
              <div className="rounded-xl border border-zinc-800 bg-zinc-950/70 p-3">
                <p className="mb-2 text-xs text-zinc-500">متن قالب</p>
                <p className="whitespace-pre-wrap break-words text-sm leading-7 text-zinc-300">{selectedSmsTemplate.content}</p>
              </div>
            ) : (
              <div className="rounded-xl border border-amber-900/70 bg-amber-950/30 p-3 text-sm leading-6 text-amber-200">
                قالب فعالی موجود نیست. ابتدا یک قالب بسازید یا قالبی را فعال کنید.
                <Link href="/sms-templates" onClick={() => setSmsDialogOpen(false)} className="mr-2 inline-flex text-amber-100 underline underline-offset-4 hover:text-white">رفتن به مدیریت قالب‌ها</Link>
              </div>
            )}
            <div className="rounded-xl border border-zinc-800 bg-zinc-950/50 p-3">
              <p className="mb-2 text-xs text-zinc-500">گیرندگان انتخاب‌شده</p>
              <div className="flex flex-wrap gap-1.5">
                {selectedCustomers.slice(0, 8).map((customer) => (
                  <span key={customer.id} className="rounded-full border border-zinc-700 px-2.5 py-1 text-xs text-zinc-300">{customer.firstName} {customer.lastName}</span>
                ))}
                {selectedCustomers.length > 8 && <span className="px-2 py-1 text-xs text-zinc-500">و {numberFormat.format(selectedCustomers.length - 8)} نفر دیگر</span>}
              </div>
            </div>
            <p className="rounded-lg border border-amber-900/60 bg-amber-950/20 px-3 py-2.5 text-xs leading-5 text-amber-200">
              درگاه پیامک هنوز انتخاب نشده است. این مرحله فقط ارسال را شبیه‌سازی می‌کند و پیام واقعی به موبایل‌ها فرستاده نمی‌شود.
            </p>
            <div className="flex justify-start gap-2 border-t border-zinc-800 pt-4">
              <button type="button" onClick={() => setSmsDialogOpen(false)} className="rounded-lg border border-zinc-700 px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-800">انصراف</button>
              <button type="button" disabled={pending || !selectedSmsTemplate || !selectedCustomerIds.size} onClick={sendSelectedSms} className="inline-flex items-center gap-2 rounded-lg bg-zinc-100 px-4 py-2 text-sm font-semibold text-zinc-950 hover:bg-white disabled:cursor-not-allowed disabled:opacity-50">
                <Send className="size-4" /> {pending ? "در حال پردازش..." : "ارسال آزمایشی"}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
