import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { admin, username } from "better-auth/plugins";
import { db } from "@/db";

const trustedOrigins = [
  process.env.BETTER_AUTH_URL,
  ...(process.env.BETTER_AUTH_TRUSTED_ORIGINS ?? "").split(","),
]
  .map((origin) => origin?.trim())
  .filter((origin): origin is string => Boolean(origin));

export const auth = betterAuth({
  appName: "پنل مدیریت",
  baseURL: process.env.BETTER_AUTH_URL,
  trustedOrigins,
  secret: process.env.BETTER_AUTH_SECRET,
  database: prismaAdapter(db, { provider: "sqlserver" }),
  emailAndPassword: { enabled: true, disableSignUp: true },
  plugins: [
    admin(),
    username({
      minUsernameLength: 3,
      maxUsernameLength: 30,
      usernameValidator: (value) => /^[\p{L}\p{N}_.-]+$/u.test(value),
    }),
  ],
  user: {
    additionalFields: {
      isActive: { type: "boolean", required: false, defaultValue: true, input: false },
      isDeleted: { type: "boolean", required: false, defaultValue: false, input: false },
      deletedAt: { type: "date", required: false, input: false },
    },
  },
  session: { expiresIn: 60 * 60 * 24 * 7, updateAge: 60 * 60 * 24 },
});
