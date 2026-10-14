const { limited, ip, json, clean, esc } = require("./_util");

async function sendEmail({ to, subject, html, replyTo }) {
  if (!process.env.RESEND_API_KEY || !process.env.EMAIL_FROM) {
    throw new Error("Resend is not configured");
  }
  const payload = { from: process.env.EMAIL_FROM, to: [to], subject, html };
  if (replyTo) payload.reply_to = replyTo;
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: "Bearer " + process.env.RESEND_API_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    const detail = await response.text();
    console.error("Resend email failed:", response.status, detail.slice(0, 500));
    throw new Error("Email delivery failed");
  }
}

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return json(405, { error: "Method not allowed" });
  }
  if (limited(ip(event), 5, 600000)) {
    return json(429, { error: "Too many requests. Please try again later." });
  }

  let body;
  try {
    body = JSON.parse(event.body || "{}");
  } catch {
    return json(400, { error: "Please submit the form again." });
  }

  // Hidden anti-spam field; bots are quietly accepted without sending email.
  if (body.website) return json(200, { ok: true });

  const fields = {
    name: clean(body.name, 80),
    email: clean(body.email, 120),
    phone: clean(body.phone, 35),
    service: clean(body.service, 100),
    location: clean(body.location, 120),
    preferredDate: /^\d{4}-\d{2}-\d{2}$/.test(body.preferredDate || "") ? body.preferredDate : "",
    details: clean(body.details, 2000),
  };

  if (
    !fields.name ||
    !fields.phone ||
    !fields.details ||
    !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(fields.email)
  ) {
    return json(400, { error: "Please complete the required fields correctly." });
  }

  const ownerEmail = process.env.OWNER_EMAIL;
  if (!ownerEmail || !process.env.RESEND_API_KEY || !process.env.EMAIL_FROM) {
    console.error("Missing OWNER_EMAIL, RESEND_API_KEY, or EMAIL_FROM environment variable.");
    return json(503, { error: "The form is not ready yet. Please contact the company by phone or email." });
  }

  const rows = Object.entries(fields)
    .map(([key, value]) => `<tr><th align="left" style="padding:8px;border:1px solid #ddd">${esc(key)}</th><td style="padding:8px;border:1px solid #ddd">${esc(value || "—")}</td></tr>`)
    .join("");

  try {
    // The complete request goes to the company's inbox. Replying to the email
    // will reply to the visitor who submitted the form.
    await sendEmail({
      to: ownerEmail,
      subject: `New website project enquiry — ${fields.name}`,
      replyTo: fields.email,
      html: `<div style="font-family:Arial,sans-serif;color:#222"><h2>New HAVEN BUILT project enquiry</h2><p>A visitor submitted the website project form.</p><table style="border-collapse:collapse;width:100%">${rows}</table></div>`,
    });

    // Confirmation is helpful but must not cause the visitor's request to fail
    // if the confirmation email cannot be sent.
    try {
      await sendEmail({
        to: fields.email,
        subject: "We received your HAVEN BUILT enquiry",
        html: `<p>Hello ${esc(fields.name)},</p><p>Thank you for contacting HAVEN BUILT. We have received your project enquiry and will get back to you.</p>`,
      });
    } catch (confirmationError) {
      console.error("Visitor confirmation email failed:", confirmationError.message);
    }

    return json(200, { ok: true, message: "Your enquiry has been submitted successfully." });
  } catch (error) {
    console.error(error.message);
    return json(502, { error: "We could not send your enquiry right now. Please try again or contact the company directly." });
  }
};
