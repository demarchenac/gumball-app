import {
  mysqlTable,
  varchar,
  timestamp,
  primaryKey,
} from "drizzle-orm/mysql-core";

export const verificationTokens = mysqlTable(
  "verificationTokens",

  
  {
    identifier: varchar("identifier", { length: 255 }).notNull(),
    token: varchar("token", { length: 255 }).notNull(),
    expires: timestamp("expires", { mode: "date" }).notNull(),
  },
  (vt) => ({
    compoundKey: primaryKey(vt.identifier, vt.token),
  })
);
