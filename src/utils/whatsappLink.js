export function buildWhatsAppUrl({ phone, message, countryCode = "55" }) {
  const digits = String(phone || "").replace(/\D/g, "");
  if (!digits) return null;

  const msg = String(message || "").trim();
  const url = `https://wa.me/${countryCode}${digits}${msg ? `?text=${encodeURIComponent(msg)}` : ""}`;
  return url;
}

export function openWhatsApp({ phone, message, countryCode = "55" }) {
  const url = buildWhatsAppUrl({ phone, message, countryCode });
  if (!url) return false;
  window.open(url, "_blank", "noopener,noreferrer");
  return true;
}
