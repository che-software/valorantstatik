import { NextRequest, NextResponse } from "next/server";
import { fetchMatches, buildApiError } from "@/lib/services/api-gateway";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ name: string; tag: string }> }
) {
  try {
    const { name, tag } = await params;
    const matches = await fetchMatches(name, tag, 10);
    return NextResponse.json({ matches });
  } catch (err) {
    const e = buildApiError(err);
    return NextResponse.json({ error: e.error }, { status: e.status });
  }
}
