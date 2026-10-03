export const ACCESS_MODULES = [
  { key: "customers", label: "مشتریان", path: "/customers", adminOnly: false },
  { key: "tags", label: "برچسب‌ها", path: "/tags", adminOnly: false },
  { key: "smsTemplates", label: "قالب‌های پیامک", path: "/sms-templates", adminOnly: false },
  { key: "smsHistory", label: "تاریخچه پیامک", path: "/sms-history", adminOnly: false },
  { key: "users", label: "مدیریت کاربران", path: "/users", adminOnly: true },
  { key: "backup", label: "پشتیبان‌گیری", path: "/backup", adminOnly: true },
] as const;

export type AccessModule = (typeof ACCESS_MODULES)[number]["key"];
export type RoleName = "admin" | "user";
