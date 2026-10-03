import "server-only";
import { db } from "@/db";

export async function getServerHealth() {
  const startedAt = performance.now();
  try {
    await db.$queryRaw`SELECT 1 AS ok`;
    const memory = process.memoryUsage();
    return {
      status: "healthy" as const,
      database: "connected" as const,
      databaseLatencyMs: Math.round(performance.now() - startedAt),
      uptimeSeconds: Math.round(process.uptime()),
      memoryMb: Math.round(memory.rss / 1024 / 1024),
      nodeVersion: process.version,
      checkedAt: new Date().toISOString(),
    };
  } catch {
    return {
      status: "unhealthy" as const,
      database: "disconnected" as const,
      databaseLatencyMs: null,
      uptimeSeconds: Math.round(process.uptime()),
      memoryMb: Math.round(process.memoryUsage().rss / 1024 / 1024),
      nodeVersion: process.version,
      checkedAt: new Date().toISOString(),
    };
  }
}
