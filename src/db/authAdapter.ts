import { and, eq } from "drizzle-orm"
import { nanoid } from "nanoid"
import type { Adapter } from "next-auth/adapters"

import type { DBClient } from "./driver"
import { accounts, sessions, users, verificationTokens } from "./schema"

export const defaultSchema = { accounts, sessions, users, verificationTokens }
export type DefaultSchema = typeof defaultSchema

//needs to be extensible
interface CustomSchema extends DefaultSchema {}

/** @return { import("next-auth/adapters").Adapter } */
export function DrizzleDBAdapter(client: DBClient, schema?: Partial<CustomSchema>): Adapter {
  const { users, accounts, sessions, verificationTokens } = {
    users: schema?.users ?? defaultSchema.users,
    accounts: schema?.accounts ?? defaultSchema.accounts,
    sessions: schema?.sessions ?? defaultSchema.sessions,
    verificationTokens: schema?.verificationTokens ?? defaultSchema.verificationTokens,
  }

  return {
    async createUser(user) {
      const matches = await client.select().from(users).where(eq(users.email, user.email))
      if (matches && matches[0]) {
        return matches[0]
      }

      const id = nanoid()
      await client.insert(users).values({ ...user, id })

      const newUser = await client.select().from(users).where(eq(users.id, id))
      return newUser[0]
    },

    async getUser(id) {
      const matches = await client.select().from(users).where(eq(users.id, id))
      return matches?.[0] ?? null
    },

    async getUserByEmail(email) {
      const matches = await client.select().from(users).where(eq(users.email, email))
      return matches?.[0] ?? null
    },

    async getUserByAccount({ providerAccountId, provider }) {
      const matches = await client
        .select()
        .from(accounts)
        .where(
          and(eq(accounts.providerAccountId, providerAccountId), eq(accounts.provider, provider))
        )
        .leftJoin(users, eq(accounts.userId, users.id))

      return matches?.[0]?.users ?? null
    },

    async updateUser(user) {
      if (!user.id) {
        throw new Error("No user id.")
      }

      await client.update(users).set(user).where(eq(users.id, user.id))

      const matches = await client.select().from(users).where(eq(users.id, user.id))
      return matches?.[0] ?? null
    },

    async deleteUser(userId) {
      await Promise.all([
        client.delete(users).where(eq(users.id, userId)),
        client.delete(sessions).where(eq(sessions.userId, userId)),
        client.delete(accounts).where(eq(accounts.userId, userId)),
      ])

      return
    },

    async linkAccount(account) {
      await client.insert(accounts).values(account)
      return
    },

    async unlinkAccount({ providerAccountId, provider }) {
      await client
        .delete(accounts)
        .where(
          and(eq(accounts.providerAccountId, providerAccountId), eq(accounts.provider, provider))
        )

      return
    },

    async createSession({ sessionToken, userId, expires }) {
      const matches = await client
        .select()
        .from(sessions)
        .where(eq(sessions.sessionToken, sessionToken))

      return matches?.[0] ?? null
    },

    async getSessionAndUser(sessionToken) {
      const matches = await client
        .select({ session: sessions, user: users })
        .from(sessions)
        .where(eq(sessions.sessionToken, sessionToken))
        .innerJoin(users, eq(users.id, sessions.userId))

      return matches?.[0] ?? null
    },

    async updateSession(session) {
      await client
        .update(sessions)
        .set(session)
        .where(eq(sessions.sessionToken, session.sessionToken))

      const matches = await client
        .select()
        .from(sessions)
        .where(eq(sessions.sessionToken, session.sessionToken))

      return matches?.[0] ?? null
    },

    async deleteSession(sessionToken) {
      await client.delete(sessions).where(eq(sessions.sessionToken, sessionToken))

      return
    },

    async createVerificationToken({ identifier, expires, token }) {
      await client.insert(verificationTokens).values({ identifier, expires, token })

      const matches = await client
        .select()
        .from(verificationTokens)
        .where(eq(verificationTokens.identifier, identifier))

      return matches?.[0] ?? null
    },

    async useVerificationToken({ identifier, token }) {
      const matches = await client
        .select()
        .from(verificationTokens)
        .where(
          and(eq(verificationTokens.identifier, identifier), eq(verificationTokens.token, token))
        )

      const tokenToDelete = matches[0] ?? null

      if (!tokenToDelete) {
        return null
      }

      await client
        .delete(verificationTokens)
        .where(
          and(eq(verificationTokens.identifier, identifier), eq(verificationTokens.token, token))
        )

      return tokenToDelete
    },
  }
}
