// extracted from: https://github.com/nextauthjs/next-auth/blob/92383d5254c95910a87fb28908a6a3a8da295ae7/packages/adapter-drizzle/src/planetscale/index.ts
// PR for Next-Auth Drizzle orm adapter: https://github.com/nextauthjs/next-auth/pull/7165/files#diff-b1982f739da45cd0423326505822276eb5439a07e0b08659d3148dfc8c0e847b

import { and, eq } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import type { Adapter } from 'next-auth/adapters';

import type { DBClient } from './driver';
import { accounts, sessions, users, verificationTokens } from './schema';

export const defaultSchema = { accounts, sessions, users, verificationTokens };
export type DefaultSchema = typeof defaultSchema;

//needs to be extensible
interface CustomSchema extends DefaultSchema {}

export function DrizzleWithPlanetScaleAdapter(
  client: DBClient,
  schema?: Partial<CustomSchema>
): Adapter {
  const { users, accounts, sessions, verificationTokens } = {
    users: schema?.users ?? defaultSchema.users,
    accounts: schema?.accounts ?? defaultSchema.accounts,
    sessions: schema?.sessions ?? defaultSchema.sessions,
    verificationTokens: schema?.verificationTokens ?? defaultSchema.verificationTokens,
  };

  return {
    createUser: async (data) => {
      const id = nanoid(); // changed crypto.randomUUID for nanoid.

      await client.insert(users).values({ ...data, id });

      return client
        .select()
        .from(users)
        .where(eq(users.id, id))
        .then((res) => res[0]);
    },

    getUser: async (data) => {
      return (
        client
          .select()
          .from(users)
          .where(eq(users.id, data))
          .then((res) => res[0]) ?? null
      );
    },

    getUserByEmail: async (data) => {
      return (
        client
          .select()
          .from(users)
          .where(eq(users.email, data))
          .then((res) => res[0]) ?? null
      );
    },

    createSession: async (data) => {
      await client.insert(sessions).values(data);

      return client
        .select()
        .from(sessions)
        .where(eq(sessions.sessionToken, data.sessionToken))
        .then((res) => res[0]);
    },

    getSessionAndUser: async (data) => {
      return (
        client
          .select({
            session: sessions,
            user: users,
          })
          .from(sessions)
          .where(eq(sessions.sessionToken, data))
          .innerJoin(users, eq(users.id, sessions.userId))
          .then((res) => res[0]) ?? null
      );
    },

    updateUser: async (data) => {
      if (!data.id) {
        throw new Error('No user id.');
      }

      await client.update(users).set(data).where(eq(users.id, data.id));

      return client
        .select()
        .from(users)
        .where(eq(users.id, data.id))
        .then((res) => res[0]);
    },

    updateSession: async (data) => {
      await client.update(sessions).set(data).where(eq(sessions.sessionToken, data.sessionToken));

      return client
        .select()
        .from(sessions)
        .where(eq(sessions.sessionToken, data.sessionToken))
        .then((res) => res[0]);
    },

    linkAccount: async (rawAccount) => {
      await client
        .insert(accounts)
        .values(rawAccount)
        .then((res) => res.rows[0]);
    },

    getUserByAccount: async (account) => {
      const dbAccount = await client
        .select()
        .from(accounts)
        .where(
          and(
            eq(accounts.providerAccountId, account.providerAccountId),
            eq(accounts.provider, account.provider)
          )
        )
        .leftJoin(users, eq(accounts.userId, users.id))
        .then((res) => res[0]);

      // fixes: If user already exists but has no linked oauth account and tries to sign in
      // source: https://github.com/nextauthjs/next-auth/pull/7165/files/e3dd9f4ed158390ce79278f273d8ae559ba42078#r1227254279
      if (!dbAccount) return null;

      return dbAccount.users;
    },

    deleteSession: async (sessionToken) => {
      await client.delete(sessions).where(eq(sessions.sessionToken, sessionToken));
    },

    createVerificationToken: async (token) => {
      await client.insert(verificationTokens).values(token);

      return client
        .select()
        .from(verificationTokens)
        .where(eq(verificationTokens.identifier, token.identifier))
        .then((res) => res[0]);
    },

    useVerificationToken: async (token) => {
      try {
        const deletedToken =
          (await client
            .select()
            .from(verificationTokens)
            .where(
              and(
                eq(verificationTokens.identifier, token.identifier),
                eq(verificationTokens.token, token.token)
              )
            )
            .then((res) => res[0])) ?? null;

        await client
          .delete(verificationTokens)
          .where(
            and(
              eq(verificationTokens.identifier, token.identifier),
              eq(verificationTokens.token, token.token)
            )
          );

        return deletedToken;
      } catch (err) {
        throw new Error('No verification token found.');
      }
    },

    deleteUser: async (id) => {
      await Promise.all([
        client.delete(users).where(eq(users.id, id)),
        client.delete(sessions).where(eq(sessions.userId, id)),
        client.delete(accounts).where(eq(accounts.userId, id)),
      ]);

      return null;
    },

    unlinkAccount: async (account) => {
      await client
        .delete(accounts)
        .where(
          and(
            eq(accounts.providerAccountId, account.providerAccountId),
            eq(accounts.provider, account.provider)
          )
        );

      return undefined;
    },
  };
}
