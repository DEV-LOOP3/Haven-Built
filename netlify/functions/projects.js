const { limited, ip, json, clean, esc } = require("./_util");
const mail = async (to, subject, html) => {
  if (!process.env.RESEND_API_KEY) return;
  const r = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: "Bearer " + process.env.RESEND_API_KEY, "content-type": "application/json" },
    body: JSON.stringify({ from: process.env.EMAIL_FROM, to: [to], subject, html }),
  });
  if (!r.ok) console.error("email failed", r.status);
};
exports.handler = async (event) => {
  if (event.httpMethod !== "POST") return json(405, { error: "Method not allowed" });
  if (limited(ip(event), 5, 600000)) return json(429, { error: "Too many requests. Please try again later." });
  let b; try { b = JSON.parse(event.body || "{}"); } catch { return json(400, { error: "Bad request" }); }
  if (b.website) return json(200, { ok: true }); // honeypot: bots fill this hidden field
  const row = {
    name: clean(b.name, 80), email: clean(b.email, 120), phone: clean(b.phone, 25), service: clean(b.service, 80),
    location: clean(b.location, 100), preferred_date: /^\d{4}-\d{2}-\d{2}$/.test(b.preferredDate || "") ? b.preferredDate : null, details: clean(b.details, 800),
  };
  if (!row.name || !row.phone || !row.details || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(row.email)) return json(400, { error: "Please complete all required fields correctly." });
  try {
    const r = await fetch(process.env.SUPABASE_URL + "/rest/v1/bookings", {
      method: "POST",
      headers: { apikey: process.env.SUPABASE_SERVICE_KEY, Authorization: "Bearer " + process.env.SUPABASE_SERVICE_KEY, "content-type": "application/json", Prefer: "return=minimal" },
      body: JSON.stringify(row),
    });
    if (!r.ok) throw new Error("db " + r.status);
  } catch (e) { console.error(e.message); return json(500, { error: "We could not save your request. Please call 08080651069." }); }
  const rows = Object.entries(row).map(([k, v]) => \`<tr><td><b>\${esc(k)}</b></td><td>\${esc(v ?? "")}</td></tr>\`).join("");
  await Promise.allSettled([
    mail(process.env.OWNER_EMAIL, "New project request: " + row.name, \`<table>\${rows}</table>\`),
    mail(row.email, "We received your project request", \`<p>Hello \${esc(row.name)}, thank you for contacting HAVEN BUILT. We will reach out shortly.</p><p>Call 08080651069 for anything urgent.</p>\`),
  ]);
  return json(200, { ok: true });
};