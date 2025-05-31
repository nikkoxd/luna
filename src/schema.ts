import { relations } from "drizzle-orm";
import { bigint, boolean, char, integer, pgTable, primaryKey, text } from "drizzle-orm/pg-core";

export const guilds = pgTable("guilds", {
  id: bigint({ mode: "number" }).primaryKey(),
  locale: char({ length: 2 }).default("en").notNull(),
  announceJoins: boolean().default(true).notNull(),
  joinMessage: text().default("").notNull(),
});

export const guildsRelations = relations(guilds, ({ many }) => ({
  members: many(members),
}));

export const members = pgTable("members", {
  id: bigint({ mode: "number" }).notNull(),
  guildId: bigint({ mode: "number" }).notNull(),
  exp: integer().default(0).notNull(),
  balance: integer().default(0).notNull(),
}, (table) => [
  primaryKey({ columns: [table.id, table.guildId] }),
]);

export const membersRelations = relations(members, ({ one }) => ({
  guild: one(guilds, {
    fields: [members.guildId],
    references: [guilds.id],
  }),
}));
