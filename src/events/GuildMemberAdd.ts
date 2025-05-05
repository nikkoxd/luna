import { Events, GuildFeature, GuildMember } from "discord.js";
import { Event } from "../types/Event";

const GuildMemberAdd: Event = {
  name: Events.GuildMemberAdd,
  once: false,
  execute(member: GuildMember) {
    if (
      member.guild.features.includes(GuildFeature.MemberVerificationGateEnabled) ||
      !member.guild.systemChannel
    ) return;

    member.guild.systemChannel.send(`Welcome to ${member.guild.name}, <@${member.id}>! Please read the rules and guidelines before chatting.`);
  }
}

export default GuildMemberAdd;
