import 'server-only';

export interface InvitePayload {
  email: string;
  url: string;
  projectName: string;
  invitedByName: string;
  expiresAt: number;
}

export interface SendInviteResult {
  /** True if delivered through an email transport (Resend). */
  emailed: boolean;
  /**
   * The accept-invite URL, returned to the client only when email delivery is NOT configured
   * (so the prototype is usable without setting up Resend). When `emailed` is true, this is
   * null — the invitee should follow the link in their inbox.
   */
  fallbackLink: string | null;
}

/**
 * Sends a project invite via Resend if RESEND_API_KEY is set. Otherwise returns the link so the
 * caller can render it inline — this keeps the prototype usable out of the box without an email
 * transport. Always logs to the server console as a backup. Mirrors sendMagicLink.
 */
export async function sendInvite(payload: InvitePayload): Promise<SendInviteResult> {
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
          subject: `${payload.invitedByName} invited you to "${payload.projectName}" on Information Kit`,
          html: renderHtml(payload),
          text: renderText(payload),
        }),
      });
      if (res.ok) {
        return { emailed: true, fallbackLink: null };
      }
      const text = await res.text();
      console.error('[invite] Resend send failed:', res.status, text);
    } catch (err) {
      console.error('[invite] Resend send threw:', err);
    }
  }

  // No transport (or transport failed): surface the link in the response.
  console.log(`[invite] for ${payload.email} → ${payload.projectName}: ${payload.url}`);
  return { emailed: false, fallbackLink: payload.url };
}

function renderHtml({ url, projectName, invitedByName }: InvitePayload): string {
  return `<!doctype html>
<html><body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #111;">
  <h2 style="margin: 0 0 8px;">You've been invited to a project</h2>
  <p style="margin: 0 0 16px;">${escapeHtml(invitedByName)} invited you to collaborate on <strong>${escapeHtml(projectName)}</strong> in Information Kit.</p>
  <p style="margin: 0 0 16px;">
    <a href="${url}" style="background:#111;color:#fff;padding:10px 14px;border-radius:6px;text-decoration:none;font-weight:600;">Accept invite</a>
  </p>
  <p style="margin: 0 0 4px; color:#666; font-size: 12px;">Or paste this URL into your browser:</p>
  <p style="margin: 0; color:#666; font-size: 12px; word-break: break-all;">${url}</p>
</body></html>`;
}

function renderText({ url, projectName, invitedByName }: InvitePayload): string {
  return `${invitedByName} invited you to collaborate on "${projectName}" in Information Kit.\n\nAccept the invite by opening this link:\n\n${url}\n`;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
