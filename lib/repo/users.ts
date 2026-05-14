import { getKV } from './redis';
import { UserSchema, type User } from './schemas';
import { makeId } from './ids';

const userKey = (id: string) => `user:${id}`;
const userByEmailKey = (email: string) => `user:byEmail:${email.toLowerCase()}`;

export interface UpsertUserInput {
  email: string;
  name: string;
  image: string | null;
}

export async function upsertUser(input: UpsertUserInput): Promise<User> {
  const kv = getKV();
  const emailKey = userByEmailKey(input.email);
  const existingId = await kv.getString(emailKey);
  if (existingId) {
    const existing = await kv.jsonGet<User>(userKey(existingId));
    if (existing) {
      const merged: User = {
        ...existing,
        name: input.name,
        image: input.image,
      };
      await kv.jsonSet(userKey(existingId), merged);
      return merged;
    }
  }
  const user: User = UserSchema.parse({
    id: makeId('u_'),
    email: input.email,
    name: input.name,
    image: input.image,
    createdAt: Date.now(),
  });
  await kv.jsonSet(userKey(user.id), user);
  await kv.setString(emailKey, user.id);
  return user;
}

export async function getUserById(id: string): Promise<User | null> {
  return getKV().jsonGet<User>(userKey(id));
}

export async function getUserByEmail(email: string): Promise<User | null> {
  const kv = getKV();
  const id = await kv.getString(userByEmailKey(email));
  if (!id) return null;
  return kv.jsonGet<User>(userKey(id));
}
