import { int, mysqlTable, primaryKey, text, varchar } from 'drizzle-orm/mysql-core';
import type { AdapterAccount } from 'next-auth/adapters';

export const accounts = mysqlTable(
  'accounts',
  {
    userId: varchar('userId', { length: 255 }).notNull(),
    type: varchar('type', { length: 255 }).$type<AdapterAccount['type']>().notNull(),
    provider: varchar('provider', { length: 255 }).notNull(),
    providerAccountId: varchar('providerAccountId', { length: 255 }).notNull(),
    refresh_token: text('refresh_token'),
    access_token: text('access_token'),
    expires_at: int('expires_at'),
    token_type: varchar('token_type', { length: 255 }),
    scope: varchar('scope', { length: 255 }),
    id_token: text('id_token'),
    session_state: text('session_state'),
  },
  (account) => ({ compoundKey: primaryKey(account.provider, account.providerAccountId) })
);
