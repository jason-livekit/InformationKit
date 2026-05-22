import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { upsertUser, getUserByEmail } from '@/lib/repo/users';
import { consumeMagicToken } from '@/lib/repo/magic-tokens';

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      id: 'magic-link',
      name: 'Magic link',
      credentials: {
        token: { label: 'token', type: 'text' },
      },
      async authorize(creds) {
        const token = typeof creds?.token === 'string' ? creds.token : null;
        if (!token) return null;
        const email = await consumeMagicToken(token);
        if (!email) return null;
        const user = await upsertUser({
          email,
          name: email.split('@')[0] ?? email,
          image: null,
        });
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
        };
      },
    }),
  ],
  secret: process.env.AUTH_SECRET ?? 'dev-secret-not-for-production',
  session: { strategy: 'jwt' },
  pages: {
    signIn: '/sign-in',
  },
  callbacks: {
    async jwt({ token, user }) {
      const t = token as Record<string, unknown>;
      const email = (user?.email ?? (t.email as string | undefined)) || undefined;
      if (email) {
        const record = await getUserByEmail(email);
        if (record) {
          t.userId = record.id;
          t.email = record.email;
          t.name = record.name;
          t.picture = record.image ?? undefined;
        }
      }
      return token;
    },
    async session({ session, token }) {
      const userId = (token as Record<string, unknown>).userId;
      if (typeof userId === 'string' && session.user) {
        session.user.id = userId;
      }
      return session;
    },
  },
});

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      email?: string | null;
      name?: string | null;
      image?: string | null;
    };
  }
}
