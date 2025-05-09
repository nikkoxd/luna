import { Events, GuildFeature, GuildMember } from "discord.js";
import { Event } from "../types/Event";
import i18next from "i18next";
import { getGuildLocale } from "../utils";

const GuildMemberAdd: Event = {
  name: Events.GuildMemberAdd,
  once: false,
  async execute(member: GuildMember) {
    if (
      member.guild.features.includes(GuildFeature.MemberVerificationGateEnabled) ||
      !member.guild.systemChannel
    ) return;

    const locale = await getGuildLocale(member.guild.id);
    member.guild.systemChannel.send(i18next.t("greeting", {
      guild: member.guild.name,
      memberId: member.user.id,
      lng: locale,
    }));
  }
}

export default GuildMemberAdd;
