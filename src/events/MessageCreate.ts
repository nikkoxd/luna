import { Collection, Events, Message } from "discord.js";
import { Event } from "../base/Event";
import { bot } from "..";
import { guilds, members, users } from "../schema";
import { eq, sql } from "drizzle-orm";
import { randomInt } from "crypto";

export default class MessageCreateEvent extends Event<Events.MessageCreate> {
  constructor() {
    super(Events.MessageCreate, false);
  }

  cooldown = 5_000;
  timestamps = new Collection<string, number>();

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
      .where(eq(guilds.id, Number(message.guild.id)))

    const expToAdd = randomInt(config.minExp, config.maxExp);
    const balanceToAdd = randomInt(config.minCoins, config.maxCoins);

    try {
      await bot.drizzle.transaction(async (tx) => {
        await tx.insert(users).values({
          id: Number(message.author.id),
        }).onConflictDoNothing();

        await tx.insert(members).values({
          id: Number(message.author.id),
          guildId: Number(message.guild!.id),
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
      });
    } catch (error) {
      bot.logger.error(error);
    }
  }
}
