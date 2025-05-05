import { Events, GuildMember } from "discord.js";
import { Event } from "../interfaces/Event";

const GuildMemberAdd: Event = {
  name: Events.GuildMemberAdd,
  once: false,
  execute(member: GuildMember) {
    console.log(`New member joined: ${member.user.tag}`);
  }
}

export default GuildMemberAdd;
