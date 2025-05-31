import { Events, GuildFeature, GuildMember } from "discord.js";
import { Event } from "../types/Event";
import i18next from "i18next";
import { getGuildLocale } from "../utils";
import { bot } from "..";
import { guilds, members } from "../schema";
import { eq } from "drizzle-orm";

const GuildMemberAdd: Event = {
  name: Events.GuildMemberAdd,
  once: false,
  async execute(member: GuildMember) {
    await bot.drizzle.insert(members).values({
      id: Number(member.user.id),
      guildId: Number(member.guild.id),
    }).onConflictDoNothing();

    if (
      member.guild.features.includes(GuildFeature.MemberVerificationGateEnabled) ||
      !member.guild.systemChannel
    ) return;

    const [config] = await bot.drizzle
      .select({ joinMessage: guilds.joinMessage })
      .from(guilds)
      .where(eq(guilds.id, Number(member.guild.id)))

    let message: string;
    if (config?.joinMessage) {
      message = config.joinMessage
        .replace("{{username}}", member.user.username)
        .replace("{{mention}}", `<@${member.user.id}>`)
        .replace("{{guild}}", member.guild.name)
    } else {
      const locale = await getGuildLocale(member.guild.id);
      if (!locale) return;
      message = i18next.t("greeting", {
        guild: member.guild.name,
        memberId: member.user.id,
        lng: locale,
      })
    }
    member.guild.systemChannel.send(message);
  }
}

export default GuildMemberAdd;
