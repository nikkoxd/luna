import { bigint, boolean, char, pgTable } from "drizzle-orm/pg-core";

export const guilds = pgTable("guilds", {
  id: bigint({ mode: "number" }).primaryKey(),
  locale: char({ length: 2 }).default("en"),
  announceJoins: boolean().default(true),
})

export const members = pgTable("members", {
  id: bigint({ mode: "number" }).primaryKey(),
  guildId: bigint({ mode: "number" }).references(() => guilds.id),
})
