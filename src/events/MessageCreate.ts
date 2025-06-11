import { Collection, Events, GuildMember, Message } from "discord.js";
import { Event } from "../base/Event";
import { bot } from "..";
import { guilds, members, roles, users } from "../schema";
import { and, eq, gte, sql } from "drizzle-orm";
import { randomInt } from "crypto";
import i18next from "i18next";
import { getGuildLocale } from "../utils";

export default class MessageCreateEvent extends Event<Events.MessageCreate> {
    constructor() {
        super(Events.MessageCreate, false);
    }

    cooldown = 5_000;
    timestamps = new Collection<string, number>();

    async processRoles(member: GuildMember, level: number) {
        bot.logger.info("Processing roles...")
        bot.logger.info(`Guild id: ${member.guild.id}, level: ${level}`)

        const result = await bot.drizzle.select({ id: roles.id, level: roles.level }).from(roles).where(and(
            eq(roles.guildId, BigInt(member.guild.id)),
            gte(roles.level, level)
        ));

        bot.logger.info(result);

        if (result.length === 0) return;

        for (const role of result) {
            const guildRole = member.guild.roles.cache.get(role.id.toString());
            if (!guildRole) continue;

            member.roles.remove(guildRole);
            bot.logger.info("Removed!");
        }

        const highestGuildRole = member.guild.roles.cache.get(result[result.length - 1].id.toString());
        if (!highestGuildRole) return;

        member.roles.add(highestGuildRole);
        bot.logger.info("Added!");
    }

    async execute(message: Message) {
        if (
            message.system || message.author.bot ||
            !message.member || !message.guild || message.interactionMetadata
        ) return;

        const now = Date.now();
        const timestamp = this.timestamps.get(message.member.id);
        if (timestamp) {
            const expirationTime = timestamp + this.cooldown;

            if (now < expirationTime) {
                return;
            }
        }
        this.timestamps.set(message.member.id, now);
        setTimeout(() => this.timestamps.delete(message.member!.id), this.cooldown)

        const [config] = await bot.drizzle
            .select({
                minExp: guilds.minExp, maxExp: guilds.maxExp,
                minCoins: guilds.minCoins, maxCoins: guilds.maxCoins
            })
            .from(guilds)
            .where(eq(guilds.id, BigInt(message.guild.id)))

        const expToAdd = randomInt(config.minExp, config.maxExp);
        const balanceToAdd = randomInt(config.minCoins, config.maxCoins);

        try {
            await bot.drizzle.transaction(async (tx) => {
                await tx.insert(users).values({
                    id: BigInt(message.author.id),
                }).onConflictDoNothing();

                const beforeUpdateMember = await tx.select({ level: members.level }).from(members).where(and(
                    eq(members.id, BigInt(message.author.id)),
                    eq(members.guildId, BigInt(message.guild!.id))
                ))
                const previousLevel = beforeUpdateMember[0] ? beforeUpdateMember[0].level : 0;

                const updatedMember = await tx.insert(members).values({
                    id: BigInt(message.author.id),
                    guildId: BigInt(message.guild!.id),
                    exp: expToAdd,
                    balance: balanceToAdd,
                }).onConflictDoUpdate({
                    target: [members.id, members.guildId],
                    set: {
                        exp: sql`${members.exp} + ${expToAdd}`,
                        balance: sql`${members.balance} + ${balanceToAdd}`,
                        level: sql`FLOOR((SQRT(4 * (${members.exp} + ${expToAdd}) / 50 + 1) - 1) / 2)`
                    }
                }).returning({ level: members.level });
                const newLevel = updatedMember[0] ? updatedMember[0].level : 0;

                if (newLevel > previousLevel) {
                    if (!message.channel.isSendable()) return;

                    this.processRoles(message.member!, newLevel);
                    message.channel.send(i18next.t(
                        "event.message_create.level_up",
                        { userId: message.author.id, level: newLevel, lng: await getGuildLocale(message.guildId!) }
                    ));
                }
            });
        } catch (error) {
            bot.logger.error(error);
        }
    }
}
