import { NextResponse } from 'next/server';
import { auth } from '@/auth';

const PROTECTED_PREFIXES = ['/projects', '/studies', '/preview', '/invite'];
const PROTECTED_API_PREFIXES = ['/api/projects', '/api/studies'];

/** Outside participants submit to an open study without signing in. Only POST is public;
 *  the route handler still guards GET/DELETE (owner-only) on this same path. */
const PUBLIC_SUBMISSION_RE = /^\/api\/studies\/[^/]+\/submissions\/?$/;

export default auth((req) => {
  const { pathname } = req.nextUrl;
  if (req.method === 'POST' && PUBLIC_SUBMISSION_RE.test(pathname)) {
    return NextResponse.next();
  }
  const needsAuth =
    PROTECTED_PREFIXES.some((p) => pathname.startsWith(p)) ||
    PROTECTED_API_PREFIXES.some((p) => pathname.startsWith(p));
  if (!needsAuth) return NextResponse.next();
  if (req.auth) return NextResponse.next();
  if (pathname.startsWith('/api/')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const signInUrl = new URL('/sign-in', req.nextUrl.origin);
  signInUrl.searchParams.set('next', pathname);
  return NextResponse.redirect(signInUrl);
});

export const config = {
  matcher: ['/((?!_next|favicon\\.ico|icons|fonts|.*\\.(?:svg|png|jpg|jpeg|webp|gif|ico)).*)'],
};
