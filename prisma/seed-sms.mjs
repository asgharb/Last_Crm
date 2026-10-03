import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const placeholders = [
  {
    token: "((نام مشتری))",
    label: "نام مشتری",
    customerField: "firstName",
    description: "نام مشتری دریافت‌کننده پیامک.",
  },
  {
    token: "((نام خانوادگی مشتری))",
    label: "نام خانوادگی مشتری",
    customerField: "lastName",
    description: "نام خانوادگی مشتری دریافت‌کننده پیامک.",
  },
  {
    token: "((نام کامل مشتری))",
    label: "نام کامل مشتری",
    customerField: "firstName + lastName",
    description: "نام و نام خانوادگی مشتری دریافت‌کننده پیامک.",
  },
  {
    token: "((وضعیت مشتری))",
    label: "وضعیت مشتری",
    customerField: "isActive",
    description: "وضعیت فعلی مشتری به‌صورت فعال یا غیرفعال.",
  },
  {
    token: "((شهر مشتری))",
    label: "شهر مشتری",
    customerField: "city",
    description: "شهر ثبت‌شده در پرونده مشتری.",
  },
];

try {
  let created = 0;

  for (const placeholder of placeholders) {
    const existing = await prisma.smsPlaceholder.findUnique({
      where: { token: placeholder.token },
      select: { id: true },
    });

    if (existing) {
      await prisma.smsPlaceholder.update({
        where: { id: existing.id },
        data: { ...placeholder, isSystem: true, isDeleted: false, deletedAt: null },
      });
      continue;
    }

    await prisma.smsPlaceholder.create({
      data: { ...placeholder, isSystem: true },
    });
    created += 1;
  }

  console.log(`${placeholders.length} reserved SMS placeholders are available; ${created} created.`);
} finally {
  await prisma.$disconnect();
}
