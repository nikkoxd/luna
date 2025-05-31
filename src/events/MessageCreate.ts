import { Events, Message } from "discord.js";
import { Event } from "../types/Event";
import { bot } from "..";
import { guilds, members } from "../schema";
import { eq, sql } from "drizzle-orm";
import { randomInt } from "crypto";

const MessageCreate: Event = {
  name: Events.MessageCreate,
  once: false,
  async execute(message: Message) {
    if (
      message.system || message.author.bot ||
      !message.member || !message.guild || message.interactionMetadata
    ) return;

    const [config] = await bot.drizzle
      .select({
        minExp: guilds.minExp, maxExp: guilds.maxExp,
        minCoins: guilds.minCoins, maxCoins: guilds.maxCoins
      })
      .from(guilds)
      .where(eq(guilds.id, Number(message.guild.id)))

    const expToAdd = randomInt(config.minExp, config.maxExp);
    const balanceToAdd = randomInt(config.minCoins, config.maxCoins);

    try {
      await bot.drizzle.insert(members).values({
        id: Number(message.author.id),
        guildId: Number(message.guild.id),
        exp: expToAdd,
        balance: balanceToAdd,
      }).onConflictDoUpdate({
        target: [members.id, members.guildId],
        set: {
          exp: sql`${members.exp} + ${expToAdd}`,
          balance: sql`${members.balance} + ${balanceToAdd}`,
          level: sql`FLOOR((SQRT(4 * (${members.exp} + ${expToAdd}) / 50 + 1) - 1) / 2)`
        }
      });
    } catch (error) {
      bot.logger.error(error);
    }
  }
}

export default MessageCreate;
