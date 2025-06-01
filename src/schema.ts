import { relations } from "drizzle-orm";
import { bigint, boolean, char, integer, pgTable, primaryKey, text, timestamp } from "drizzle-orm/pg-core";

export const guilds = pgTable("guilds", {
  id: bigint({ mode: "number" }).primaryKey(),

  locale: char({ length: 2 }).default("en").notNull(),
  announceJoins: boolean().default(true).notNull(),
  joinMessage: text().default("").notNull(),
  logChannelId: bigint({ mode: "number" }),

  minExp: integer().default(15).notNull(),
  maxExp: integer().default(35).notNull(),
  minCoins: integer().default(50).notNull(),
  maxCoins: integer().default(85).notNull(),

  createdAt: timestamp().defaultNow(),
  updatedAt: timestamp().defaultNow(),
});

export const guildsRelations = relations(guilds, ({ many }) => ({
  members: many(members),
  roles: many(roles),
  userRoles: many(userRoles),
}));

export const users = pgTable("users", {
  id: bigint({ mode: "number" }).primaryKey(),

  createdAt: timestamp().defaultNow(),
  updatedAt: timestamp().defaultNow(),
});

export const userRelations = relations(users, ({ many }) => ({
  userRoles: many(userRoles),
}));

export const members = pgTable("members", {
  id: bigint({ mode: "number" }).notNull().references(() => users.id),
  guildId: bigint({ mode: "number" }).notNull().references(() => guilds.id),

  level: integer().default(0).notNull(),
  exp: integer().default(0).notNull(),
  balance: integer().default(0).notNull(),

  createdAt: timestamp().defaultNow(),
  updatedAt: timestamp().defaultNow(),
}, (table) => [
  primaryKey({ columns: [table.id, table.guildId] }),
]);

export const membersRelations = relations(members, ({ one }) => ({
  guild: one(guilds, {
    fields: [members.guildId],
    references: [guilds.id],
  }),
}));

export const roles = pgTable("roles", {
  id: bigint({ mode: "number" }).primaryKey(),
  guildId: bigint({ mode: "number" }).notNull().references(() => guilds.id),

  isPurchaseable: boolean().default(false).notNull(),
  price: integer().default(0).notNull(),

  createdAt: timestamp().defaultNow(),
  updatedAt: timestamp().defaultNow(),
});

export const roleRelations = relations(roles, ({ many }) => ({
  userRoles: many(userRoles),
}));

export const userRoles = pgTable("user_roles", {
  userId: bigint({ mode: "number" }).notNull().references(() => users.id),
  guildId: bigint({ mode: "number" }).notNull().references(() => guilds.id),
  roleId: bigint({ mode: "number" }).notNull().references(() => roles.id),

  createdAt: timestamp().defaultNow(),
}, (table) => [
  primaryKey({ columns: [table.userId, table.guildId, table.roleId] }),
]);
