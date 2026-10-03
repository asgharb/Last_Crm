"use client";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;
export const DialogClose = DialogPrimitive.Close;
export function DialogContent({ className, children, ...props }: React.ComponentProps<typeof DialogPrimitive.Content>) {
  return <DialogPrimitive.Portal><DialogPrimitive.Overlay className="dialog-overlay fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm" /><DialogPrimitive.Content dir="rtl" className={cn("dialog-content fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-lg rounded-2xl border border-slate-700/80 bg-slate-900 p-6 text-slate-100 shadow-2xl shadow-black/35", className)} {...props}>{children}<DialogPrimitive.Close className="absolute left-4 top-4 rounded-md p-1 text-slate-400 hover:bg-slate-800 hover:text-white"><X className="size-4" /><span className="sr-only">بستن</span></DialogPrimitive.Close></DialogPrimitive.Content></DialogPrimitive.Portal>;
}
export function DialogTitle(props: React.ComponentProps<typeof DialogPrimitive.Title>) { return <DialogPrimitive.Title className="text-lg font-bold" {...props} />; }
export function DialogDescription(props: React.ComponentProps<typeof DialogPrimitive.Description>) { return <DialogPrimitive.Description className="mt-1 text-sm text-slate-400" {...props} />; }
