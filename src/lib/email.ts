import { formatPrice } from "./catalog";

/*
 * Transactional email through Resend's HTTP API. Server-only, but don't import
 * `server-only` here: `auth.ts` imports this file and the Better Auth CLI loads
 * that config directly.
 *
 * Env is read on each send, never at module top level. Without RESEND_API_KEY
 * nothing is sent and the message is logged to the server console instead, so
 * local development works without an account.
 */

/** Resend's shared test sender. It only delivers to the Resend account's own address. */
const DEFAULT_FROM = "Altiere <onboarding@resend.dev>";

/** Resend normally answers in well under a second; give up rather than hang a request on it. */
const TIMEOUT_MS = 10_000;

type Email = {
  to: string;
  subject: string;
  /** Plain-text body. The HTML version is built from the same paragraphs. */
  text: string;
  html: string;
  /** Resend drops a second send with the same key (kept for 24 hours). */
  idempotencyKey?: string;
};

export function isEmailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY);
}

/** Sends one email. Throws if Resend rejects it, so callers decide whether that matters. */
export async function sendEmail(email: Email): Promise<void> {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.log(
      `[email] RESEND_API_KEY is not set, so this was not sent.\nTo: ${email.to}\nSubject: ${email.subject}\n\n${email.text}`,
    );
    return;
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    signal: AbortSignal.timeout(TIMEOUT_MS),
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      ...(email.idempotencyKey && { "Idempotency-Key": email.idempotencyKey }),
    },
    body: JSON.stringify({
      from: process.env.EMAIL_FROM || DEFAULT_FROM,
      to: [email.to],
      subject: email.subject,
      text: email.text,
      html: email.html,
    }),
  });
  if (!response.ok) {
    throw new Error(`Resend returned ${response.status}: ${await response.text()}`);
  }
}

/**
 * Adds an address to the Resend contact list (Audience in the dashboard), which
 * is where newsletter Broadcasts are sent from. Needs a full-access API key: a
 * send-only key is rejected. Throws if the contact could not be saved.
 *
 * An address that is already a contact is left exactly as it is. Creating it
 * again would re-subscribe someone who had unsubscribed, and this form is
 * public, so anyone could do that to an address that isn't theirs.
 */
export async function addNewsletterContact(email: string): Promise<void> {
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error("RESEND_API_KEY is not set.");
  const headers = { Authorization: `Bearer ${key}`, "Content-Type": "application/json" };
  const url = "https://api.resend.com/contacts";

  const existing = await fetch(`${url}/${encodeURIComponent(email)}`, {
    headers,
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (existing.ok) return;
  if (existing.status !== 404) {
    throw new Error(`Resend returned ${existing.status}: ${await existing.text()}`);
  }

  const created = await fetch(url, {
    method: "POST",
    headers,
    signal: AbortSignal.timeout(TIMEOUT_MS),
    body: JSON.stringify({ email, unsubscribed: false }),
  });
  if (!created.ok) throw new Error(`Resend returned ${created.status}: ${await created.text()}`);
}

/* ── Messages ─────────────────────────────────────────────────────────── */

export function passwordResetEmail(input: { to: string; url: string }): Email {
  return {
    to: input.to,
    subject: "Reset your Altiere password",
    text: [
      "We received a request to reset the password for your Altiere account.",
      `Choose a new password: ${input.url}`,
      "If you didn't ask for this, you can ignore this email. Your password stays the same.",
    ].join("\n\n"),
    html: layout(`
      <h1 style="${styles.heading}">Reset your password</h1>
      <p style="${styles.text}">We received a request to reset the password for your Altiere account.</p>
      <p style="margin:28px 0"><a href="${escapeHtml(input.url)}" style="${styles.button}">Choose a new password</a></p>
      <p style="${styles.muted}">If you didn&rsquo;t ask for this, you can ignore this email. Your password stays the same.</p>
    `),
  };
}

type OrderEmailInput = {
  to: string;
  orderNumber: string;
  items: { name: string; color: string; size: string | null; quantity: number; unitPriceCents: number }[];
  totalCents: number;
  /** Address lines, already filtered of blanks. */
  address: string[];
};

export function orderConfirmationEmail(order: OrderEmailInput): Email {
  const detail = (item: OrderEmailInput["items"][number]) =>
    [item.color, item.size && `Size ${item.size}`, `Qty ${item.quantity}`].filter(Boolean).join(" · ");
  const price = (item: OrderEmailInput["items"][number]) =>
    formatPrice(item.unitPriceCents * item.quantity);

  const text = [
    `Thank you for your order. Your payment was received.`,
    `Order ${order.orderNumber}`,
    order.items.map((item) => `${item.name} (${detail(item)}): ${price(item)}`).join("\n"),
    `Total: ${formatPrice(order.totalCents)}`,
    order.address.length > 0 && `Delivering to:\n${order.address.join("\n")}`,
  ]
    .filter(Boolean)
    .join("\n\n");

  const rows = order.items
    .map(
      (item) => `
      <tr>
        <td style="${styles.cell}">
          ${escapeHtml(item.name)}<br>
          <span style="color:#6b6b6b;font-size:13px">${escapeHtml(detail(item))}</span>
        </td>
        <td style="${styles.cell};text-align:right;white-space:nowrap;vertical-align:top">${price(item)}</td>
      </tr>`,
    )
    .join("");

  const html = layout(`
    <p style="${styles.eyebrow}">Order ${escapeHtml(order.orderNumber)}</p>
    <h1 style="${styles.heading}">Thank you for your order</h1>
    <p style="${styles.text}">Your payment was received.</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:28px;border-top:1px solid #e3e3e3">
      ${rows}
      <tr>
        <td style="padding:16px 0;${styles.label}">Total</td>
        <td style="padding:16px 0;text-align:right;font-size:17px">${formatPrice(order.totalCents)}</td>
      </tr>
      ${
        order.address.length > 0
          ? `<tr>
        <td style="padding:16px 0;border-top:1px solid #e3e3e3;vertical-align:top;${styles.label}">Delivering to</td>
        <td style="padding:16px 0;border-top:1px solid #e3e3e3;text-align:right;color:#6b6b6b">${order.address.map(escapeHtml).join("<br>")}</td>
      </tr>`
          : ""
      }
    </table>
  `);

  return {
    to: order.to,
    subject: `Your Altiere order ${order.orderNumber}`,
    text,
    html,
  };
}

export function orderShippedEmail(order: {
  to: string;
  orderNumber: string;
  trackingNumber: string | null;
  /** Address lines, already filtered of blanks. */
  address: string[];
}): Email {
  const tracking = order.trackingNumber && `Tracking number: ${order.trackingNumber}`;
  return {
    to: order.to,
    subject: `Your Altiere order ${order.orderNumber} has shipped`,
    text: [
      `Good news: your order ${order.orderNumber} is on its way.`,
      tracking,
      order.address.length > 0 && `Delivering to:\n${order.address.join("\n")}`,
    ]
      .filter(Boolean)
      .join("\n\n"),
    html: layout(`
      <p style="${styles.eyebrow}">Order ${escapeHtml(order.orderNumber)}</p>
      <h1 style="${styles.heading}">Your order is on its way</h1>
      <p style="${styles.text}">We&rsquo;ve handed your order to the courier.</p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:28px;border-top:1px solid #e3e3e3">
        ${
          order.trackingNumber
            ? `<tr>
          <td style="${styles.cell};${styles.label}">Tracking number</td>
          <td style="${styles.cell};text-align:right">${escapeHtml(order.trackingNumber)}</td>
        </tr>`
            : ""
        }
        ${
          order.address.length > 0
            ? `<tr>
          <td style="padding:16px 0;vertical-align:top;${styles.label}">Delivering to</td>
          <td style="padding:16px 0;text-align:right;color:#6b6b6b">${order.address.map(escapeHtml).join("<br>")}</td>
        </tr>`
            : ""
        }
      </table>
    `),
  };
}

/* ── HTML helpers ─────────────────────────────────────────────────────── */

// Email clients ignore stylesheets, so every style is inline.
const styles = {
  eyebrow: "margin:0 0 12px;font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:#6b6b6b",
  heading: "margin:0 0 16px;font-family:Georgia,'Times New Roman',serif;font-weight:400;font-size:28px;line-height:1.2;color:#111111",
  text: "margin:0;font-size:15px;line-height:1.6;color:#111111",
  muted: "margin:0;font-size:13px;line-height:1.6;color:#6b6b6b",
  label: "font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:#111111",
  cell: "padding:16px 0;border-bottom:1px solid #e3e3e3;font-size:15px;line-height:1.5;color:#111111",
  button:
    "display:inline-block;padding:14px 28px;background:#111111;color:#ffffff;font-size:12px;letter-spacing:0.14em;text-transform:uppercase;text-decoration:none",
};

function layout(body: string): string {
  return `<!doctype html>
<html lang="en">
  <body style="margin:0;padding:0;background:#ffffff;font-family:Helvetica,Arial,sans-serif">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td align="center" style="padding:40px 24px">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px">
            <tr>
              <td style="padding-bottom:32px;font-family:Georgia,'Times New Roman',serif;font-size:20px;letter-spacing:0.3em;color:#111111">ALTIERE</td>
            </tr>
            <tr>
              <td>${body}</td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
