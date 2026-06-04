export function riotCookieDefaults(maxAge?: number) {
  return {
    httpOnly: true as const,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/" as const,
    ...(maxAge != null ? { maxAge } : {}),
  };
}
