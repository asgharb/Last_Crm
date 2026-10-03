import type {Metadata} from "next";
import {Vazirmatn} from "next/font/google";
import {Toaster} from "sonner";
import "./globals.css";

const vazirmatn = Vazirmatn({subsets: ["arabic", "latin"], variable: "--font-vazirmatn", display: "swap"});
export const metadata: Metadata = {title: "پنل مدیریت", description: "داشبورد مدیریت کاربران"};
export default function RootLayout({children}: Readonly<{ children: React.ReactNode }>) {
    return <html lang="fa" dir="rtl" className={vazirmatn.variable}>
    <body className="h-screen overflow-hidden bg-slate-950 text-slate-100"><Toaster position="bottom-right" dir="rtl"
                                                                                  theme="dark" richColors
                                                                                  visibleToasts={5} toastOptions={{
        duration: 7000,
        classNames: {toast: "toast-progress font-[family-name:var(--font-vazirmatn)]"}
    }}/>{children}</body>
    </html>;
}
