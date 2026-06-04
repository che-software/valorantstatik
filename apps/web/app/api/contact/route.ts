// Contact form — Resend ile mail gönderir
// Rate limiting: IP başına 3/10dk, email başına 2/1saat, global 20/1dk
import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { cacheGet, cacheSet } from "@/lib/redis";

const TO_EMAIL = "ensare646@gmail.com";

// ── Sabitler ──────────────────────────────────────────────────────────────
const LIMITS = {
  ip:     { max: 3,  ttl: 600  }, // IP başına 3 istek / 10 dakika
  email:  { max: 2,  ttl: 3600 }, // Email başına 2 istek / 1 saat
  global: { max: 20, ttl: 60   }, // Global 20 istek / 1 dakika
} as const;

const MAX_LENGTHS = { name: 80, email: 120, message: 2000 };

// ── Rate limit yardımcısı ─────────────────────────────────────────────────
async function checkLimit(key: string, max: number, ttl: number): Promise<{ blocked: boolean; remaining: number }> {
  const current = (await cacheGet<number>(key)) ?? 0;
  if (current >= max) return { blocked: true, remaining: 0 };
  // TTL'i ilk yazımda set et, sonraki artışlarda koru
  await cacheSet(key, current + 1, ttl);
  return { blocked: false, remaining: max - current - 1 };
}

// ── Email format doğrulama ────────────────────────────────────────────────
function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
}

// ── IP alma ───────────────────────────────────────────────────────────────
function getIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown"
  );
}

// ── POST handler ──────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const ip = getIp(req);

  // 1. Global rate limit
  const global = await checkLimit("contact:global", LIMITS.global.max, LIMITS.global.ttl);
  if (global.blocked) {
    return NextResponse.json(
      { error: "Sunucu meşgul. Lütfen biraz bekleyin." },
      { status: 429, headers: { "Retry-After": "60" } }
    );
  }

  // 2. IP rate limit
  const ipCheck = await checkLimit(`contact:ip:${ip}`, LIMITS.ip.max, LIMITS.ip.ttl);
  if (ipCheck.blocked) {
    return NextResponse.json(
      { error: "Çok fazla istek gönderdiniz. 10 dakika sonra tekrar deneyin." },
      { status: 429, headers: { "Retry-After": "600" } }
    );
  }

  // 3. Body parse
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Geçersiz istek formatı." }, { status: 400 });
  }

  const { name, email, message } = body as Record<string, unknown>;

  // 4. Varlık kontrolü
  if (!name || !email || !message) {
    return NextResponse.json({ error: "Tüm alanlar zorunludur." }, { status: 400 });
  }

  // 5. Tip kontrolü
  if (typeof name !== "string" || typeof email !== "string" || typeof message !== "string") {
    return NextResponse.json({ error: "Geçersiz alan tipi." }, { status: 400 });
  }

  // 6. Uzunluk sınırları
  if (name.trim().length < 2) {
    return NextResponse.json({ error: "İsim en az 2 karakter olmalıdır." }, { status: 400 });
  }
  if (name.length > MAX_LENGTHS.name) {
    return NextResponse.json({ error: `İsim en fazla ${MAX_LENGTHS.name} karakter olabilir.` }, { status: 400 });
  }
  if (email.length > MAX_LENGTHS.email) {
    return NextResponse.json({ error: "Geçersiz e-posta adresi." }, { status: 400 });
  }
  if (message.trim().length < 10) {
    return NextResponse.json({ error: "Mesaj en az 10 karakter olmalıdır." }, { status: 400 });
  }
  if (message.length > MAX_LENGTHS.message) {
    return NextResponse.json({ error: `Mesaj en fazla ${MAX_LENGTHS.message} karakter olabilir.` }, { status: 400 });
  }

  // 7. Email format
  if (!isValidEmail(email.trim())) {
    return NextResponse.json({ error: "Geçerli bir e-posta adresi girin." }, { status: 400 });
  }

  // 8. Email başına rate limit (validation sonrası — geçerli email'e göre)
  const emailKey = `contact:email:${email.trim().toLowerCase()}`;
  const emailCheck = await checkLimit(emailKey, LIMITS.email.max, LIMITS.email.ttl);
  if (emailCheck.blocked) {
    return NextResponse.json(
      { error: "Bu e-posta adresiyle çok fazla mesaj gönderildi. 1 saat sonra tekrar deneyin." },
      { status: 429, headers: { "Retry-After": "3600" } }
    );
  }

  // 9. HTML injection temizleme
  const safe = (s: string) =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

  // 10. Mail gönder
  const resend = new Resend(process.env.RESEND_API_KEY);

  try {
    const { error } = await resend.emails.send({
      from: "KediPotter Tracker <onboarding@resend.dev>",
      to: TO_EMAIL,
      replyTo: email.trim(),
      subject: `[KediPotter Tracker] ${safe(name.trim())} mesaj gönderdi`,
      html: `
        <div style="font-family:sans-serif;max-width:520px;margin:0 auto;background:#0f1923;color:#ece8e1;padding:32px;border-radius:12px;">
          <h2 style="color:#FF4655;margin:0 0 24px">Yeni İletişim Mesajı</h2>
          <table style="width:100%;border-collapse:collapse;">
            <tr>
              <td style="padding:8px 0;color:#ffffff80;font-size:13px;width:80px">İsim</td>
              <td style="padding:8px 0;font-size:14px">${safe(name.trim())}</td>
            </tr>
            <tr>
              <td style="padding:8px 0;color:#ffffff80;font-size:13px">E-posta</td>
              <td style="padding:8px 0;font-size:14px"><a href="mailto:${safe(email.trim())}" style="color:#FF4655">${safe(email.trim())}</a></td>
            </tr>
            <tr>
              <td style="padding:8px 0;color:#ffffff80;font-size:13px">IP</td>
              <td style="padding:8px 0;font-size:12px;color:#ffffff40">${safe(ip)}</td>
            </tr>
          </table>
          <hr style="border:none;border-top:1px solid #ffffff15;margin:20px 0"/>
          <p style="font-size:13px;color:#ffffff80;margin:0 0 8px">Mesaj:</p>
          <p style="font-size:14px;line-height:1.6;white-space:pre-wrap;margin:0">${safe(message.trim())}</p>
          <hr style="border:none;border-top:1px solid #ffffff15;margin:24px 0"/>
          <p style="font-size:11px;color:#ffffff30;margin:0">KediPotter Tracker · Valorant İstatistik Platformu</p>
        </div>
      `,
    });

    if (error) {
      console.error("[Contact] Resend error:", error);
      return NextResponse.json({ error: "Mail gönderilemedi." }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[Contact] Unexpected error:", err);
    return NextResponse.json({ error: "Sunucu hatası." }, { status: 500 });
  }
}
