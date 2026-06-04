import { NextRequest, NextResponse } from "next/server";
import { getProfile, buildApiError } from "@/lib/services/api-gateway";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ name: string; tag: string }> }
) {
  try {
    const { name, tag } = await params;
    const result = await getProfile(name, tag);
    return NextResponse.json({ account: result.player, rank: result.player.rank });
  } catch (err) {
    const e = buildApiError(err);
    return NextResponse.json({ error: e.error }, { status: e.status });
  }
}
