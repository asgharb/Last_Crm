import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const placeholders = [
  { token: "((نام مشتری))", label: "نام مشتری", customerField: "firstName + lastName", description: "نام و نام خانوادگی مشتریِ دریافت‌کننده پیامک." },
  { token: "((نام))", label: "نام", customerField: "firstName", description: "نام کوچک مشتری." },
  { token: "((نام خانوادگی))", label: "نام خانوادگی", customerField: "lastName", description: "نام خانوادگی مشتری." },
  { token: "((کد مشتری))", label: "کد مشتری", customerField: "customerCode", description: "شناسه عددی مشتری که دیتابیس ساخته است." },
  { token: "((موبایل مشتری))", label: "موبایل مشتری", customerField: "mobile", description: "شماره موبایل مشتریِ دریافت‌کننده پیامک." },
  { token: "((تاریخ تولد مشتری))", label: "تاریخ تولد مشتری", customerField: "birthDate", description: "تاریخ تولد مشتری با نمایش شمسی." },
  { token: "((طبقه مشتری))", label: "طبقه مشتری", customerField: "customerClass", description: "طبقه مشتری: بنکدار، عمده‌فروش یا خرده‌فروش." },
  { token: "((تگ‌های مشتری))", label: "تگ‌های مشتری", customerField: "tags[].name", description: "نام تگ‌های متصل به مشتری، جداشده با ویرگول." },
  { token: "((استان مشتری))", label: "استان مشتری", customerField: "province", description: "استان ثبت‌شده در پرونده مشتری." },
  { token: "((شهر مشتری))", label: "شهر مشتری", customerField: "city", description: "شهر ثبت‌شده در پرونده مشتری." },
  { token: "((نام پدر مشتری))", label: "نام پدر مشتری", customerField: "fatherName", description: "نام پدر مشتری." },
];

try {
  for (const placeholder of placeholders) {
    await prisma.smsPlaceholder.upsert({
      where: { token: placeholder.token },
      create: { ...placeholder, isSystem: true },
      update: { ...placeholder, isSystem: true, isDeleted: false, deletedAt: null },
    });
  }
  console.log(`Seeded ${placeholders.length} reserved SMS placeholders.`);
} finally {
  await prisma.$disconnect();
}
