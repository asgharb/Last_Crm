import { PrismaClient } from "@prisma/client";
import { hashPassword } from "better-auth/crypto";
import { randomUUID } from "node:crypto";

const prisma = new PrismaClient();

const seedUsers = [
  {
    username: process.env.SEED_ADMIN_USERNAME || "admin",
    name: "System Administrator",
    role: "admin",
    password: process.env.SEED_ADMIN_PASSWORD,
  },
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

function validateUsers() {
  for (const user of seedUsers) {
    if (!user.password || user.password.length < 12) {
      throw new Error(`Set a unique password of at least 12 characters for ${user.username} in .env.local.`);
    }
    if (user.username.length < 3 || user.username.length > 30) {
      throw new Error(`Seed username ${user.username} must be between 3 and 30 characters.`);
    }
  }
}

async function seedUser({ username, name, role, password }) {
  const normalizedUsername = username.toLowerCase();
  const email = `${normalizedUsername}@seed.local`;
  const user = await prisma.user.upsert({
    where: { username: normalizedUsername },
    update: {
      name,
      email,
      role,
      isActive: true,
      isDeleted: false,
      deletedAt: null,
      banned: false,
      banReason: null,
      banExpires: null,
    },
    create: {
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

  const account = await prisma.account.findFirst({
    where: { userId: user.id, providerId: "credential" },
  });
  const hashedPassword = await hashPassword(password);

  if (account) {
    await prisma.account.update({
      where: { id: account.id },
      data: { accountId: user.id, password: hashedPassword, updatedAt: new Date() },
    });
  } else {
    await prisma.account.create({
      data: {
        id: randomUUID(),
        accountId: user.id,
        providerId: "credential",
        userId: user.id,
        password: hashedPassword,
      },
    });
  }

  console.log(`Seeded ${role} user: ${normalizedUsername}`);
}

try {
  validateUsers();
  for (const user of seedUsers) await seedUser(user);
} finally {
  await prisma.$disconnect();
}
