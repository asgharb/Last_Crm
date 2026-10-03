function getDatabaseSettings(connectionString: string) {
  const segments = connectionString.split(";");
  const databaseIndex = segments.findIndex((segment) => {
    const key = segment.split("=", 1)[0]?.trim().toLowerCase();
    return key === "database" || key === "initial catalog";
  });

  if (databaseIndex === -1) {
    throw new Error("DATABASE_URL must contain a database or initial catalog value.");
  }

  const separatorIndex = segments[databaseIndex].indexOf("=");
  const databaseName = segments[databaseIndex].slice(separatorIndex + 1).trim();
  if (!databaseName) {
    throw new Error("The database name in DATABASE_URL cannot be empty.");
  }

  const masterSegments = [...segments];
  masterSegments[databaseIndex] = `${segments[databaseIndex].slice(0, separatorIndex)}=master`;

  return { databaseName, masterUrl: masterSegments.join(";") };
}

async function ensureDatabase() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not defined. Add it to .env.local.");
  }

  const { databaseName, masterUrl } = getDatabaseSettings(connectionString);
  process.env.DATABASE_URL = masterUrl;

  const { PrismaClient } = await import("@prisma/client");
  const prisma = new PrismaClient();

  try {
    const databases = await prisma.$queryRaw<Array<{ databaseId: number | null }>>`
      SELECT DB_ID(${databaseName}) AS databaseId
    `;

    if (databases[0]?.databaseId) {
      console.log(`Database [${databaseName}] already exists.`);
      return;
    }

    const escapedDatabaseName = databaseName.replaceAll("]", "]]");
    await prisma.$executeRawUnsafe(`CREATE DATABASE [${escapedDatabaseName}]`);
    console.log(`Database [${databaseName}] created successfully.`);
  } finally {
    await prisma.$disconnect();
  }
}

ensureDatabase().catch((error) => {
  console.error("Failed to ensure database existence:", error);
  process.exitCode = 1;
});
