/**
 * Optional Club OTP delivery.
 * Prefer RESEND_API_KEY; otherwise SMTP_* via nodemailer is not required —
 * Resend HTTP keeps the Docker image lean.
 */

export function isOtpEmailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY && process.env.OTP_FROM_EMAIL);
}

/** Returns true when a provider accepted the message. */
export async function sendOtpEmail(to: string, code: string): Promise<boolean> {
  const apiKey = (process.env.RESEND_API_KEY || '').trim();
  const from = (process.env.OTP_FROM_EMAIL || '').trim();
  if (!apiKey || !from) return false;

  const subject = 'Your Meridian Club verification code';
  const text = `Your Meridian Club code is ${code}. It expires in 10 minutes.\n\nIf you did not request this, ignore this email.`;
  const html = `<p>Your Meridian Club code is <strong style="font-size:1.25rem;letter-spacing:0.12em">${code}</strong>.</p><p>It expires in 10 minutes.</p><p style="color:#666">If you did not request this, ignore this email.</p>`;

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ from, to, subject, text, html }),
    });
    if (!res.ok) {
      const body = await res.text();
      console.warn('[otp-email] Resend failed:', res.status, body.slice(0, 200));
      return false;
    }
    return true;
  } catch (err) {
    console.warn('[otp-email] send failed:', err instanceof Error ? err.message : err);
    return false;
  }
}
