const LIVEKIT_HOSTNAMES = new Set([
  'livekit.io',
  'www.livekit.io',
  'docs.livekit.io',
  'cloud.livekit.io',
  'livekit.com',
  'www.livekit.com',
  'docs.livekit.com',
  'cloud.livekit.com',
]);

export function isExternalLink(href?: string): boolean {
  if (!href || !href.startsWith('http')) {
    return false;
  }

  try {
    const url = new URL(href);
    const host = url.hostname;

    return !LIVEKIT_HOSTNAMES.has(host);
  } catch {
    return false;
  }
}
