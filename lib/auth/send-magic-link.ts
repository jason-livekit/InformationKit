import 'server-only';

export interface MagicLinkPayload {
  email: string;
  url: string;
  expiresAt: number;
}

export interface SendResult {
  /** True if delivered through an email transport (Resend). */
  emailed: boolean;
  /**
   * The sign-in URL, returned to the client only when email delivery is NOT configured
   * (so the prototype is usable without setting up Resend). When `emailed` is true, this
   * is null — users should sign in via the link in their inbox.
   */
  fallbackLink: string | null;
}

/**
 * Sends the magic link via Resend if RESEND_API_KEY is set. Otherwise returns the link so
 * the sign-in page can render it inline — this keeps the prototype usable out of the box
 * without an email transport. Always logs to the server console as a backup.
 */
export async function sendMagicLink(payload: MagicLinkPayload): Promise<SendResult> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.MAGIC_LINK_FROM ?? 'Information Kit <onboarding@resend.dev>';

  if (apiKey) {
    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from,
          to: [payload.email],
          subject: 'Your Information Kit sign-in link',
          html: renderHtml(payload),
          text: renderText(payload),
        }),
      });
      if (res.ok) {
        return { emailed: true, fallbackLink: null };
      }
      const text = await res.text();
      console.error('[magic-link] Resend send failed:', res.status, text);
    } catch (err) {
      console.error('[magic-link] Resend send threw:', err);
    }
  }

  // No transport (or transport failed): surface the link in the response.
  console.log(`[magic-link] for ${payload.email}: ${payload.url}`);
  return { emailed: false, fallbackLink: payload.url };
}

function renderHtml({ url }: MagicLinkPayload): string {
  return `<!doctype html>
<html><body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #111;">
  <h2 style="margin: 0 0 8px;">Sign in to Information Kit</h2>
  <p style="margin: 0 0 16px;">Click the button below to finish signing in. This link expires in 15 minutes and can only be used once.</p>
  <p style="margin: 0 0 16px;">
    <a href="${url}" style="background:#111;color:#fff;padding:10px 14px;border-radius:6px;text-decoration:none;font-weight:600;">Sign in</a>
  </p>
  <p style="margin: 0 0 4px; color:#666; font-size: 12px;">Or paste this URL into your browser:</p>
  <p style="margin: 0; color:#666; font-size: 12px; word-break: break-all;">${url}</p>
</body></html>`;
}

function renderText({ url }: MagicLinkPayload): string {
  return `Sign in to Information Kit by opening this link (valid for 15 minutes, single-use):\n\n${url}\n`;
}
