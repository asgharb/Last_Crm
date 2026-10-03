"use client";
import * as Alert from "@radix-ui/react-alert-dialog";
export const AlertDialog = Alert.Root;
export const AlertDialogTrigger = Alert.Trigger;
export function AlertDialogContent(props: React.ComponentProps<typeof Alert.Content>) { return <Alert.Portal><Alert.Overlay className="dialog-overlay fixed inset-0 z-50 bg-black/70 backdrop-blur-sm" /><Alert.Content dir="rtl" className="dialog-content fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-md rounded-2xl border border-zinc-800 bg-zinc-900 p-6 shadow-2xl" {...props} /></Alert.Portal>; }
export const AlertDialogTitle = Alert.Title;
export const AlertDialogDescription = Alert.Description;
export const AlertDialogCancel = Alert.Cancel;
export const AlertDialogAction = Alert.Action;
