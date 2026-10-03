"use client";

import { useState, useTransition, type FormEvent } from "react";
import { Pencil, Plus, Tags, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { createTag, softDeleteTag, updateTag } from "@/lib/actions/tags";

type TagRecord = { id: string; name: string; color: string; _count: { customers: number } };
type TagDraft = { name: string; color: string };
const emptyDraft: TagDraft = { name: "", color: "#71717a" };

export function TagsManager({ initialTags }: { initialTags: TagRecord[] }) {
  const [tags, setTags] = useState(initialTags);
  const [draft, setDraft] = useState(emptyDraft);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  function startCreate() {
    setEditingId(null);
    setDraft(emptyDraft);
    setOpen(true);
  }

  function startEdit(tag: TagRecord) {
    setEditingId(tag.id);
    setDraft({ name: tag.name, color: tag.color });
    setOpen(true);
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    startTransition(async () => {
      try {
        if (editingId) {
          await updateTag(editingId, draft);
          toast.success("تگ ویرایش شد.");
        } else {
          await createTag(draft);
          toast.success("تگ جدید ساخته شد.");
        }
        setOpen(false);
        window.location.reload();
      } catch (error) {
        toast.error("ذخیرهٔ تگ انجام نشد.", {
          description: error instanceof Error ? error.message : "لطفاً دوباره تلاش کنید.",
        });
      }
    });
  }

  function remove(tag: TagRecord) {
    startTransition(async () => {
      try {
        await softDeleteTag(tag.id);
        setTags((current) => current.filter((item) => item.id !== tag.id));
        toast.warning("تگ حذف شد.", { description: "تگ از فهرست قابل انتخاب خارج شد." });
      } catch (error) {
        toast.error("حذف تگ انجام نشد.", {
          description: error instanceof Error ? error.message : "لطفاً دوباره تلاش کنید.",
        });
      }
    });
  }

  return (
    <>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mb-2 text-sm text-zinc-500">مدیریت سیستم / تگ‌ها</p>
          <h1 className="text-3xl font-bold tracking-tight">مدیریت تگ‌ها</h1>
        </div>
        <button onClick={startCreate} className="inline-flex items-center gap-2 rounded-lg bg-zinc-100 px-4 py-2.5 text-sm font-semibold text-zinc-950 hover:bg-white">
          <Plus className="size-4" /> تگ جدید
        </button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/70">
        <div className="grid grid-cols-[1fr_auto_auto] items-center gap-3 border-b border-zinc-800 bg-zinc-950/70 px-4 py-3 text-xs text-zinc-500 sm:grid-cols-[1fr_10rem_8rem_8rem]">
          <span>نام تگ</span><span className="hidden sm:block">رنگ</span><span>مشتریان</span><span className="text-center">عملیات</span>
        </div>
        {tags.map((tag) => (
          <div key={tag.id} className="grid grid-cols-[1fr_auto_auto] items-center gap-3 border-b border-zinc-800 px-4 py-3 last:border-b-0 sm:grid-cols-[1fr_10rem_8rem_8rem]">
            <div className="flex min-w-0 items-center gap-2.5">
              <span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: tag.color }} />
              <span className="truncate text-sm font-medium">{tag.name}</span>
            </div>
            <span className="hidden font-mono text-xs text-zinc-500 sm:block">{tag.color}</span>
            <span className="text-xs text-zinc-400">{new Intl.NumberFormat("fa-IR").format(tag._count.customers)}</span>
            <div className="flex items-center justify-center gap-1">
              <button type="button" disabled={pending} onClick={() => startEdit(tag)} title="ویرایش تگ" aria-label="ویرایش تگ" className="rounded-md p-2 text-zinc-400 hover:bg-zinc-800 hover:text-white disabled:opacity-50">
                <Pencil className="size-4" />
              </button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <button type="button" disabled={pending} title="حذف تگ" aria-label="حذف تگ" className="rounded-md p-2 text-red-400 hover:bg-red-950 hover:text-red-300 disabled:opacity-50">
                    <Trash2 className="size-4" />
                  </button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogTitle className="text-lg font-bold">حذف تگ</AlertDialogTitle>
                  <AlertDialogDescription className="mt-2 text-sm text-zinc-400">تگ «{tag.name}» از گزینه‌های قابل انتخاب حذف شود؟</AlertDialogDescription>
                  <div className="mt-6 flex justify-start gap-2">
                    <AlertDialogCancel className="rounded-lg border border-zinc-700 px-4 py-2 text-sm">انصراف</AlertDialogCancel>
                    <AlertDialogAction onClick={() => remove(tag)} className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold hover:bg-red-500">حذف تگ</AlertDialogAction>
                  </div>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        ))}
        {tags.length === 0 && <div className="flex flex-col items-center gap-2 py-16 text-sm text-zinc-500"><Tags className="size-7" />هنوز تگی ساخته نشده است.</div>}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogTitle>{editingId ? "ویرایش تگ" : "ساخت تگ جدید"}</DialogTitle>
          <DialogDescription>نام و رنگی برای تگ انتخاب کنید.</DialogDescription>
          <form onSubmit={submit} className="mt-5 space-y-4">
            <label className="block text-sm text-zinc-300">نام تگ
              <input required maxLength={60} autoFocus value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} className="mt-1.5 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2.5 outline-none focus:border-zinc-500" />
            </label>
            <label className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2.5 text-sm text-zinc-300">رنگ تگ
              <span className="flex items-center gap-2"><span className="font-mono text-xs text-zinc-500">{draft.color}</span><input type="color" value={draft.color} onChange={(event) => setDraft({ ...draft, color: event.target.value })} className="size-8 cursor-pointer rounded border-0 bg-transparent" /></span>
            </label>
            <div className="flex justify-start gap-2 pt-2">
              <button type="button" onClick={() => setOpen(false)} className="rounded-lg border border-zinc-700 px-4 py-2 text-sm">انصراف</button>
              <button disabled={pending} className="rounded-lg bg-zinc-100 px-4 py-2 text-sm font-semibold text-zinc-950 disabled:opacity-50">{pending ? "در حال ذخیره…" : "ذخیره"}</button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
