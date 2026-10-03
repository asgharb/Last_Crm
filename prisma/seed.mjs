import { PrismaClient } from "@prisma/client";
import { hashPassword } from "better-auth/crypto";
import { randomUUID } from "node:crypto";

const prisma = new PrismaClient();

const adminUser = {
  username: process.env.SEED_ADMIN_USERNAME || "admin",
  name: "System Administrator",
  role: "admin",
  password: process.env.SEED_ADMIN_PASSWORD,
};

const developmentUsers = [
  {
    username: "operator",
    name: "Dashboard Operator",
    role: "user",
    password: process.env.SEED_OPERATOR_PASSWORD,
  },
  {
    username: "viewer",
    name: "Dashboard Viewer",
    role: "user",
    password: process.env.SEED_VIEWER_PASSWORD,
  },
];

const seedUsers = process.env.SEED_DEMO_DATA === "true"
  ? [adminUser, ...developmentUsers]
  : [adminUser];

async function seedUser({ username, name, role, password }) {
  const normalizedUsername = username.toLowerCase();
  const email = `${normalizedUsername}@seed.local`;
  const existingUser = await prisma.user.findUnique({ where: { username: normalizedUsername } });
  if (existingUser) {
    console.log(`Seed user already exists: ${normalizedUsername}`);
    return;
  }

  if (!password || password.length < 12) {
    throw new Error(`Set a unique password of at least 12 characters for ${username} in .env.local.`);
  }
  if (username.length < 3 || username.length > 30) {
    throw new Error(`Seed username ${username} must be between 3 and 30 characters.`);
  }

  const hashedPassword = await hashPassword(password);
  await prisma.$transaction(async (transaction) => {
    const user = await transaction.user.create({
      data: {
        id: randomUUID(),
        name,
        email,
        emailVerified: false,
        username: normalizedUsername,
        displayUsername: username,
        role,
        isActive: true,
        isDeleted: false,
      },
    });

    await transaction.account.create({
      data: {
        id: randomUUID(),
        accountId: user.id,
        providerId: "credential",
        userId: user.id,
        password: hashedPassword,
      },
    });
  });

  console.log(`Seeded ${role} user: ${normalizedUsername}`);
}

try {
  for (const user of seedUsers) await seedUser(user);
} finally {
  await prisma.$disconnect();
}
