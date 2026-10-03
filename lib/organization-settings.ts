import { cache } from "react";
import { db } from "@/db";

export const THEME_COLORS = ["indigo", "blue", "emerald", "rose", "amber"] as const;
export const THEME_MODES = ["dark", "light"] as const;

export type ThemeColor = (typeof THEME_COLORS)[number];
export type ThemeMode = (typeof THEME_MODES)[number];

export const themeColorValues: Record<ThemeColor, { primary: string; hover: string; glow: string }> = {
  indigo: { primary: "#4f46e5", hover: "#6366f1", glow: "79 70 229" },
  blue: { primary: "#2563eb", hover: "#3b82f6", glow: "37 99 235" },
  emerald: { primary: "#059669", hover: "#10b981", glow: "5 150 105" },
  rose: { primary: "#e11d48", hover: "#f43f5e", glow: "225 29 72" },
  amber: { primary: "#d97706", hover: "#f59e0b", glow: "217 119 6" },
};

export const getOrganizationSettings = cache(async () => {
  return db.organizationSetting.upsert({
    where: { id: "default" },
    update: {},
    create: { id: "default" },
  });
});
