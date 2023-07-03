import { mysqlTable, varchar, timestamp } from "drizzle-orm/mysql-core";

export const sessions = mysqlTable("sessions", {
  expires: timestamp("expires", { mode: "date" }).notNull(),
  sessionToken: varchar("sessionToken", { length: 255 }).notNull().primaryKey(),
  userId: varchar("userId", { length: 255 }).notNull(),
});
