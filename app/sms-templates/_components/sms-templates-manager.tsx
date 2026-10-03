"use client";

import { useEffect, useMemo, useRef, useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { CopyPlus, MessageSquareText, Pencil, Plus, Power, Trash2, Variable } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import {
  createSmsTemplate, setSmsTemplateActive, softDeleteSmsTemplate, updateSmsTemplate,
} from "@/lib/actions/sms-templates";

type Placeholder = { id: string; token: string; label: string; description: string; customerField: string };
type Template = {
  id: string;
  name: string;
  content: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  placeholders: { placeholder: Pick<Placeholder, "id" | "token" | "label"> }[];
};
type Draft = { name: string; content: string; isActive: boolean };
const blankDraft: Draft = { name: "", content: "", isActive: true };
const inputClass = "w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2.5 text-sm text-zinc-100 outline-none transition focus:border-zinc-500 placeholder:text-zinc-600";
const numberFormat = new Intl.NumberFormat("fa-IR");

export function SmsTemplatesManager({
  initialTemplates,
  placeholders,
}: {
  initialTemplates: Template[];
  placeholders: Placeholder[];
}) {
  const router = useRouter();
  const [templates, setTemplates] = useState(initialTemplates);
  const [draft, setDraft] = useState(blankDraft);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const contentRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => setTemplates(initialTemplates), [initialTemplates]);

  const preview = useMemo(() => placeholders.reduce(
    (text, placeholder) => text.split(placeholder.token).join(`[${placeholder.label}]`),
    draft.content,
  ), [draft.content, placeholders]);

  function startCreate() {
    setEditingId(null);
    setDraft(blankDraft);
    setOpen(true);
  }

  function startEdit(template: Template) {
    setEditingId(template.id);
    setDraft({ name: template.name, content: template.content, isActive: template.isActive });
    setOpen(true);
  }

  function insertPlaceholder(token: string) {
    const textarea = contentRef.current;
    if (!textarea) {
      setDraft((current) => ({ ...current, content: `${current.content}${current.content ? " " : ""}${token}` }));
      return;
    }
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const content = `${draft.content.slice(0, start)}${token}${draft.content.slice(end)}`;
    setDraft((current) => ({ ...current, content }));
    requestAnimationFrame(() => {
      textarea.focus();
      textarea.setSelectionRange(start + token.length, start + token.length);
    });
  }

  function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    startTransition(async () => {
      try {
        if (editingId) {
          await updateSmsTemplate(editingId, draft);
          toast.success("قالب پیامک ویرایش شد.");
        } else {
          await createSmsTemplate(draft);
          toast.success("قالب پیامک ساخته شد.");
        }
        setOpen(false);
        router.refresh();
      } catch (error) {
        toast.error("ذخیرهٔ قالب پیامک انجام نشد.", {
          description: error instanceof Error ? error.message : "لطفاً دوباره تلاش کنید.",
        });
      }
    });
  }

  function toggle(template: Template) {
    startTransition(async () => {
      try {
        await setSmsTemplateActive(template.id, !template.isActive);
        setTemplates((current) => current.map((item) => item.id === template.id ? { ...item, isActive: !item.isActive } : item));
        toast.success(template.isActive ? "قالب غیرفعال شد." : "قالب فعال شد.");
      } catch (error) {
        toast.error("تغییر وضعیت قالب انجام نشد.", { description: error instanceof Error ? error.message : "لطفاً دوباره تلاش کنید." });
      }
    });
  }

  function remove(template: Template) {
    startTransition(async () => {
      try {
        await softDeleteSmsTemplate(template.id);
        setTemplates((current) => current.filter((item) => item.id !== template.id));
        toast.warning("قالب پیامک حذف شد.", { description: "قالب از فهرست قابل استفاده خارج شد." });
      } catch (error) {
        toast.error("حذف قالب انجام نشد.", { description: error instanceof Error ? error.message : "لطفاً دوباره تلاش کنید." });
      }
    });
  }

  return (
    <>
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mb-2 text-sm text-zinc-500">مدیریت پیامک / قالب‌ها</p>
          <h1 className="text-3xl font-bold tracking-tight">قالب‌های پیامک</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-400">
            متن‌های آماده بسازید و کلیدواژه‌های مشتری را در جای مناسب وارد کنید. مقدار هر کلیدواژه هنگام ارسال از پروندهٔ همان مشتری خوانده می‌شود.
          </p>
        </div>
        <button onClick={startCreate} className="inline-flex items-center gap-2 rounded-lg bg-zinc-100 px-4 py-2.5 text-sm font-semibold text-zinc-950 hover:bg-white">
          <Plus className="size-4" /> قالب جدید
        </button>
      </header>

      <div className="grid min-w-0 gap-5 xl:grid-cols-[minmax(0,1fr)_21rem]">
        <section className="min-w-0 overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/70">
          <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-3">
            <h2 className="font-semibold">فهرست قالب‌ها</h2>
            <span className="text-xs text-zinc-500">{numberFormat.format(templates.length)} قالب</span>
          </div>
          {templates.length ? (
            <div className="divide-y divide-zinc-800">
              {templates.map((template) => (
                <article key={template.id} className="min-w-0 p-4 sm:p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="truncate font-semibold">{template.name}</h3>
                        <span className={`rounded-full px-2 py-0.5 text-xs ${template.isActive ? "bg-emerald-950 text-emerald-300" : "bg-zinc-800 text-zinc-400"}`}>
                          {template.isActive ? "فعال" : "غیرفعال"}
                        </span>
                      </div>
                      <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-7 text-zinc-300">{template.content}</p>
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {template.placeholders.map(({ placeholder }) => (
                          <span key={placeholder.id} className="rounded-md border border-zinc-700 bg-zinc-950 px-2 py-1 font-mono text-[11px] text-zinc-400">{placeholder.token}</span>
                        ))}
                        {template.placeholders.length === 0 && <span className="text-xs text-zinc-600">بدون کلیدواژه</span>}
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      <button type="button" disabled={pending} onClick={() => toggle(template)} title={template.isActive ? "غیرفعال کردن" : "فعال کردن"} aria-label={template.isActive ? "غیرفعال کردن قالب" : "فعال کردن قالب"} className="rounded-md p-2 text-zinc-400 hover:bg-zinc-800 hover:text-white disabled:opacity-50">
                        <Power className="size-4" />
                      </button>
                      <button type="button" disabled={pending} onClick={() => startEdit(template)} title="ویرایش" aria-label="ویرایش قالب" className="rounded-md p-2 text-zinc-400 hover:bg-zinc-800 hover:text-white disabled:opacity-50">
                        <Pencil className="size-4" />
                      </button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <button type="button" disabled={pending} title="حذف" aria-label="حذف قالب" className="rounded-md p-2 text-red-400 hover:bg-red-950 hover:text-red-300 disabled:opacity-50">
                            <Trash2 className="size-4" />
                          </button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogTitle className="text-lg font-bold">حذف قالب پیامک</AlertDialogTitle>
                          <AlertDialogDescription className="mt-2 text-sm text-zinc-400">قالب «{template.name}» از فهرست خارج شود؟</AlertDialogDescription>
                          <div className="mt-6 flex justify-start gap-2">
                            <AlertDialogCancel className="rounded-lg border border-zinc-700 px-4 py-2 text-sm">انصراف</AlertDialogCancel>
                            <AlertDialogAction onClick={() => remove(template)} className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold hover:bg-red-500">حذف قالب</AlertDialogAction>
                          </div>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3 px-6 py-16 text-center text-sm text-zinc-500">
              <MessageSquareText className="size-8" />
              <p>هنوز قالبی ساخته نشده است.</p>
              <button onClick={startCreate} className="text-zinc-200 underline underline-offset-4">ساخت اولین قالب</button>
            </div>
          )}
        </section>

        <aside className="min-w-0 self-start overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/70">
          <div className="flex items-center gap-2 border-b border-zinc-800 px-4 py-3">
            <Variable className="size-4 text-zinc-400" />
            <h2 className="font-semibold">کلیدواژه‌های رزروشده</h2>
          </div>
          <p className="px-4 pt-3 text-xs leading-5 text-zinc-500">برای درج در متن، روی هر کلیدواژه کلیک کنید. کلیدواژه‌ها به فیلدهای پروندهٔ مشتری متصل هستند.</p>
          <div className="space-y-2 p-3">
            {placeholders.map((placeholder) => (
              <button key={placeholder.id} type="button" onClick={() => { startCreate(); setDraft((current) => ({ ...current, content: `${current.content}${current.content ? " " : ""}${placeholder.token}` })); }}
                className="group block w-full min-w-0 rounded-xl border border-zinc-800 bg-zinc-950/70 p-3 text-right transition hover:border-zinc-600 hover:bg-zinc-950">
                <span className="flex min-w-0 items-center justify-between gap-2">
                  <span className="truncate text-sm font-medium text-zinc-200">{placeholder.label}</span>
                  <CopyPlus className="size-3.5 shrink-0 text-zinc-600 group-hover:text-zinc-300" />
                </span>
                <span className="mt-1.5 block truncate font-mono text-xs text-zinc-500">{placeholder.token}</span>
                <span className="mt-1.5 block text-xs leading-5 text-zinc-600">{placeholder.description}</span>
              </button>
            ))}
          </div>
        </aside>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[calc(100dvh-2rem)] max-w-2xl overflow-y-auto overflow-x-hidden">
          <DialogTitle>{editingId ? "ویرایش قالب پیامک" : "ساخت قالب پیامک"}</DialogTitle>
          <DialogDescription>کلیدواژه‌های رزروشده را داخل متن قرار دهید تا بعداً با اطلاعات مشتری جایگزین شوند.</DialogDescription>
          <form onSubmit={save} className="mt-5 space-y-4">
            <label className="block text-sm text-zinc-300">نام قالب
              <input required maxLength={100} autoFocus value={draft.name} onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))} className={`mt-1.5 ${inputClass}`} placeholder="مثلاً تبریک تولد" />
            </label>
            <label className="block text-sm text-zinc-300">متن پیامک
              <textarea ref={contentRef} required maxLength={4000} rows={6} value={draft.content} onChange={(event) => setDraft((current) => ({ ...current, content: event.target.value }))} className={`mt-1.5 resize-y ${inputClass}`} placeholder="متن پیامک را بنویسید و کلیدواژه درج کنید..." />
            </label>
            <div className="flex flex-wrap gap-2">
              {placeholders.map((placeholder) => (
                <button key={placeholder.id} type="button" onClick={() => insertPlaceholder(placeholder.token)} className="rounded-md border border-zinc-700 bg-zinc-950 px-2 py-1.5 font-mono text-[11px] text-zinc-300 hover:border-zinc-500 hover:text-white">
                  {placeholder.token}
                </button>
              ))}
            </div>
            <div className="rounded-xl border border-zinc-800 bg-zinc-950/70 p-3">
              <div className="mb-1 text-xs font-medium text-zinc-500">پیش‌نمایش جای کلیدواژه‌ها</div>
              <p className="min-h-6 whitespace-pre-wrap break-words text-sm leading-6 text-zinc-300">{preview || "متن پیامک اینجا نمایش داده می‌شود."}</p>
            </div>
            <label className="flex items-center gap-2 text-sm text-zinc-300">
              <input type="checkbox" checked={draft.isActive} onChange={(event) => setDraft((current) => ({ ...current, isActive: event.target.checked }))} className="accent-zinc-100" />
              قالب فعال باشد
            </label>
            <div className="flex justify-start gap-2 pt-1">
              <button type="button" onClick={() => setOpen(false)} className="rounded-lg border border-zinc-700 px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-800">انصراف</button>
              <button disabled={pending} className="rounded-lg bg-zinc-100 px-4 py-2 text-sm font-semibold text-zinc-950 hover:bg-white disabled:opacity-50">{pending ? "در حال ذخیره..." : "ذخیره قالب"}</button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
