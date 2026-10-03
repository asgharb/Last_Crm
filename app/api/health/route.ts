import { NextResponse } from "next/server";
import { getServerHealth } from "@/lib/health";
export const runtime = "nodejs";
export async function GET() { const health = await getServerHealth(); return NextResponse.json(health, { status: health.status === "healthy" ? 200 : 503, headers: { "Cache-Control": "no-store" } }); }
