import type { Prisma, PrismaClient, User } from "@prisma/client";

type UserUpdate = Prisma.UserUpdateInput;

/** Soft deletion is the default; deleted records require an explicit opt-in. */
export function createUsersRepository(database: PrismaClient) {
  return {
    findMany(options: { includeDeleted?: boolean } = {}) {
      return database.user.findMany({
        where: options.includeDeleted ? undefined : { isDeleted: false },
        orderBy: { createdAt: "desc" },
      });
    },
    findFirst(id: string, options: { includeDeleted?: boolean } = {}) {
      return database.user.findFirst({
        where: { id, ...(options.includeDeleted ? {} : { isDeleted: false }) },
      });
    },
    async update(id: string, data: UserUpdate) {
      const result = await database.user.updateMany({
        where: { id, isDeleted: false },
        data: { ...data, updatedAt: new Date() },
      });
      return result.count ? database.user.findUnique({ where: { id } }) : null;
    },
    async delete(id: string) {
      const result = await database.user.updateMany({
        where: { id, isDeleted: false },
        data: { isDeleted: true, deletedAt: new Date(), updatedAt: new Date() },
      });
      return result.count ? database.user.findUnique({ where: { id } }) : null;
    },
    async deleteMany(ids: string[]) {
      if (!ids.length) return { count: 0 };
      return database.user.updateMany({
        where: { id: { in: ids }, isDeleted: false },
        data: { isDeleted: true, deletedAt: new Date(), updatedAt: new Date() },
      });
    },
    hardDelete(id: string) {
      return database.user.delete({ where: { id } });
    },
  };
}

export type UserRecord = User;
