import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

try {
  await prisma.$executeRawUnsafe(`
    IF OBJECT_ID(N'dbo.CustomerCodeSequence', N'SO') IS NULL
      EXEC(N'CREATE SEQUENCE dbo.CustomerCodeSequence AS INT START WITH 1001 INCREMENT BY 1');
  `);
  console.log("Customer code sequence is ready (starts at 1001).");
} finally {
  await prisma.$disconnect();
}
