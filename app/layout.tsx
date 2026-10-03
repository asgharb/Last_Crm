import type {Metadata} from "next";
import {Vazirmatn} from "next/font/google";
import {Toaster} from "sonner";
import "./globals.css";
import { getOrganizationSettings, themeColorValues, type ThemeColor } from "@/lib/organization-settings";

const vazirmatn = Vazirmatn({subsets: ["arabic", "latin"], variable: "--font-vazirmatn", display: "swap"});
export async function generateMetadata(): Promise<Metadata> {
    const settings = await getOrganizationSettings();
    return {title: settings.organizationName, description: `داشبورد مدیریتی ${settings.organizationName}`};
}
export default async function RootLayout({children}: Readonly<{ children: React.ReactNode }>) {
    const settings = await getOrganizationSettings();
    const color = themeColorValues[(settings.themeColor as ThemeColor) in themeColorValues ? settings.themeColor as ThemeColor : "indigo"];
    const style = {"--brand": color.primary, "--brand-hover": color.hover, "--brand-rgb": color.glow} as React.CSSProperties;
    return <html lang="fa" dir="rtl" className={vazirmatn.variable} data-theme={settings.themeMode} style={style}>
    <body className="h-screen overflow-hidden bg-slate-950 text-slate-100"><Toaster position="bottom-right" dir="rtl"
                                                                                  theme="dark" richColors
                                                                                  visibleToasts={5} toastOptions={{
        duration: 7000,
        classNames: {toast: "toast-progress font-[family-name:var(--font-vazirmatn)]"}
    }}/>{children}</body>
    </html>;
}
