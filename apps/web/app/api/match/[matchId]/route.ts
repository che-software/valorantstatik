import { NextRequest, NextResponse } from "next/server";
import { getMatch, parseApiError } from "@/lib/valorant-api";

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ matchId: string }> }
) {
  try {
    const { matchId } = await context.params;
    const match = await getMatch(matchId);
    return NextResponse.json({ match });
  } catch (err) {
    const { message, status } = parseApiError(err);
    return NextResponse.json({ error: message }, { status });
  }
}
