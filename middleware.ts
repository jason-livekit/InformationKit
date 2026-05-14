import { NextResponse } from 'next/server';
import { auth } from '@/auth';

const PROTECTED_PREFIXES = ['/projects', '/studies', '/preview'];
const PROTECTED_API_PREFIXES = ['/api/projects', '/api/studies'];

export default auth((req) => {
  const { pathname } = req.nextUrl;
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
