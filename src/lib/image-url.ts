export function isProbablyImageUrl(href: string): boolean {
  try {
    const u = new URL(href);
    const p = u.pathname.toLowerCase();
    if (/\.(png|jpe?g|gif|webp|avif|bmp)(\?|$)/i.test(p)) return true;
    if (u.searchParams.has("format") && u.hostname.includes("coze")) return true;
    return false;
  } catch {
    return /\.(png|jpe?g|gif|webp)(\?|$)/i.test(href);
  }
}
