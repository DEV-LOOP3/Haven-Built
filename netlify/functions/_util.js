const hits = new Map();
exports.limited = (ip, max = 8, windowMs = 60000) => {
  const now = Date.now();
  const arr = (hits.get(ip) || []).filter((t) => now - t < windowMs);
  arr.push(now); hits.set(ip, arr);
  return arr.length > max;
};
exports.ip = (event) => (event.headers["x-nf-client-connection-ip"] || event.headers["x-forwarded-for"] || "unknown").split(",")[0].trim();
exports.json = (status, body) => ({ statusCode: status, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
exports.clean = (v, max) => String(v ?? "").replace(/[\u0000-\u001f\u007f]/g, " ").trim().slice(0, max);
exports.esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));