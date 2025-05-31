import { Events, Message } from "discord.js";
import { Event } from "../types/Event";
import { bot } from "..";
import { members } from "../schema";
import { sql } from "drizzle-orm";

const MessageCreate: Event = {
  name: Events.MessageCreate,
  once: false,
  async execute(message: Message) {
    if (
      message.system || message.author.bot ||
      !message.member || !message.guild
    ) return;

    const expToAdd = 1;
    const balanceToAdd = 1;
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
      }
    });
  }
}

export default MessageCreate;
