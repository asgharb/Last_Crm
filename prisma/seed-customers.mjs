import { PrismaClient } from "@prisma/client";

const shouldSeedDemoData = process.env.SEED_DEMO_DATA === "true";
if (!shouldSeedDemoData) {
  console.log("Skipping sample customers outside the development seed command.");
  process.exit(0);
}

const prisma = new PrismaClient();

const starterTags = [
  { name: "نمایشگاه", color: "#8b5cf6" },
  { name: "VIP", color: "#f59e0b" },
  { name: "خوش‌حساب", color: "#10b981" },
  { name: "نیازمند پیگیری", color: "#ef4444" },
];

const customers = [
  ["آرمان", "احمدی", "0012345678", "09121110001", "مرد", "حسین", "1988-04-12", "تهران", "تهران", "متأهل"],
  ["نگار", "رضایی", "0023456789", "09121110002", "زن", "محمد", "1992-09-23", "اصفهان", "اصفهان", "مجرد"],
  ["پارسا", "کریمی", "0034567890", "09121110003", "مرد", "علی", "1985-01-08", "فارس", "شیراز", "متأهل"],
  ["مریم", "موسوی", "0045678901", "09121110004", "زن", "رضا", "1990-06-17", "خراسان رضوی", "مشهد", "متأهل"],
  ["سینا", "محمدی", "0056789012", "09121110005", "مرد", "اکبر", "1995-11-02", "البرز", "کرج", "مجرد"],
  ["الهام", "صادقی", "0067890123", "09121110006", "زن", "جواد", "1987-03-29", "گیلان", "رشت", "متأهل"],
  ["امیر", "حسینی", "0078901234", "09121110007", "مرد", "محمود", "1982-12-14", "آذربایجان شرقی", "تبریز", "متأهل"],
  ["زهرا", "جعفری", "0089012345", "09121110008", "زن", "کریم", "1998-07-05", "یزد", "یزد", "مجرد"],
  ["محمد", "رحیمی", "0090123456", "09121110009", "مرد", "حسن", "1979-02-19", "مازندران", "ساری", "متأهل"],
  ["سارا", "نوری", "0101234567", "09121110010", "زن", "بهرام", "1993-10-11", "قم", "قم", "مجرد"],
  ["پویا", "اکبری", "0112345678", "09121110011", "مرد", "فرهاد", "1989-08-30", "کرمان", "کرمان", "متأهل"],
  ["لیلا", "قاسمی", "0123456789", "09121110012", "زن", "اسماعیل", "1984-05-21", "همدان", "همدان", "متأهل"],
  ["سامان", "زارع", "0134567890", "09121110013", "مرد", "ناصر", "1996-01-26", "قزوین", "قزوین", "مجرد"],
  ["نازنین", "بهرامی", "0145678901", "09121110014", "زن", "داوود", "1991-04-03", "هرمزگان", "بندرعباس", "متأهل"],
  ["رضا", "فرهادی", "0156789012", "09121110015", "مرد", "یوسف", "1976-09-16", "اردبیل", "اردبیل", "متأهل"],
  ["مهسا", "کاظمی", "0167890123", "09121110016", "زن", "مرتضی", "1997-12-07", "مرکزی", "اراک", "مجرد"],
  ["کیان", "سلیمانی", "0178901234", "09121110017", "مرد", "عباس", "1986-07-24", "کردستان", "سنندج", "متأهل"],
  ["حدیث", "مهدوی", "0189012345", "09121110018", "زن", "جمال", "1983-11-13", "زنجان", "زنجان", "مطلقه"],
  ["بهنام", "عباسی", "0190123456", "09121110019", "مرد", "اسدالله", "1994-02-28", "کرمانشاه", "کرمانشاه", "مجرد"],
  ["ترانه", "شریفی", "0201234567", "09121110020", "زن", "کاظم", "1981-06-09", "لرستان", "خرم‌آباد", "متأهل"],
].map(([firstName, lastName, nationalCode, mobile, gender, fatherName, birthDate, province, city, maritalStatus], index) => ({
  firstName,
  lastName,
  nationalCode,
  mobile,
  gender,
  fatherName,
  birthDate: new Date(`${birthDate}T00:00:00.000Z`),
  province,
  city,
  maritalStatus,
  telephone: `021${String(44000000 + index).padStart(8, "0")}`,
  economicCode: index % 3 === 0 ? `411${String(index + 1).padStart(8, "0")}` : null,
  address: `خیابان اصلی، کوچه ${index + 1}، پلاک ${index + 10}`,
  customerClass: ["bankdar", "wholesaler", "retailer"][index % 3],
}));

try {
  const savedTags = await Promise.all(starterTags.map(async (tag) => {
    const existingTag = await prisma.tag.findUnique({ where: { name: tag.name } });
    return existingTag || prisma.tag.create({ data: tag });
  }));
  const tagIds = Object.fromEntries(savedTags.map((tag) => [tag.name, tag.id]));
  let createdCustomers = 0;

  for (const [index, customer] of customers.entries()) {
    const existingCustomer = await prisma.customer.findUnique({ where: { mobile: customer.mobile } });
    if (existingCustomer) continue;

    const savedCustomer = await prisma.customer.create({
      data: { ...customer, isDeleted: false },
    });
    createdCustomers += 1;
    const selectedTags = [
      ...(index % 4 === 0 ? [tagIds["نمایشگاه"]] : []),
      ...(index % 7 === 0 ? [tagIds.VIP] : []),
      ...(index % 3 === 0 ? [tagIds["خوش‌حساب"]] : []),
    ];
    if (selectedTags.length) {
      await prisma.customerTag.createMany({
        data: selectedTags.map((tagId) => ({ customerId: savedCustomer.id, tagId })),
      });
    }
  }

  console.log(`Created ${createdCustomers} missing sample customers; ${savedTags.length} starter tags are available.`);
} finally {
  await prisma.$disconnect();
}
