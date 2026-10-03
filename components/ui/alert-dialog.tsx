"use client";
import * as Alert from "@radix-ui/react-alert-dialog";
export const AlertDialog = Alert.Root;
export const AlertDialogTrigger = Alert.Trigger;
export function AlertDialogContent(props: React.ComponentProps<typeof Alert.Content>) { return <Alert.Portal><Alert.Overlay className="dialog-overlay fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm" /><Alert.Content dir="rtl" className="dialog-content fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-md rounded-2xl border border-slate-700/80 bg-slate-900 p-6 text-slate-100 shadow-2xl shadow-black/35" {...props} /></Alert.Portal>; }
export const AlertDialogTitle = Alert.Title;
export const AlertDialogDescription = Alert.Description;
export const AlertDialogCancel = Alert.Cancel;
export const AlertDialogAction = Alert.Action;
