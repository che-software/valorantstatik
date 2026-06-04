// Riot RSO — Logout: session cookie'yi temizler
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST() {
  const cookieStore = await cookies();
  cookieStore.delete("rso_session");
  cookieStore.delete("rso_state");
  return NextResponse.json({ success: true });
}

// GET ile de çalışsın (link ile logout için)
export async function GET() {
  const cookieStore = await cookies();
  cookieStore.delete("rso_session");
  cookieStore.delete("rso_state");
  return NextResponse.redirect(
    new URL("/", process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000")
  );
}
