import { Resend } from "resend";

const resendApiKey = process.env.RESEND_API_KEY;
const defaultFrom = process.env.RESEND_FROM_EMAIL ?? "Presupuesto <onboarding@resend.dev>";

function getClient(): Resend | null {
  if (!resendApiKey) return null;
  return new Resend(resendApiKey);
}

/**
 * Envía un correo con HTML libre. Usa RESEND_API_KEY y RESEND_FROM_EMAIL del .env
 */
export async function sendEmail(params: {
  to: string;
  subject: string;
  html: string;
  from?: string;
}): Promise<{ ok: boolean; error?: string }> {
  const resend = getClient();
  if (!resend) {
    return { ok: false, error: "RESEND_API_KEY no configurado en .env" };
  }

  const { error } = await resend.emails.send({
    from: params.from ?? defaultFrom,
    to: params.to,
    subject: params.subject,
    html: params.html,
  });

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function sendNotificationEmail(params: {
  to: string;
  subject: string;
  body: string;
  link?: string | null;
}): Promise<{ ok: boolean; error?: string }> {
  const html = params.link
    ? `<p>${escapeHtml(params.body)}</p><p><a href="${escapeHtml(params.link)}">Ver en la app</a></p>`
    : `<p>${escapeHtml(params.body)}</p>`;

  return sendEmail({
    to: params.to,
    subject: params.subject,
    html,
  });
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
