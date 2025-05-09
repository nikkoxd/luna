import { eq } from "drizzle-orm";
import { bot } from "..";
import { guilds } from "../schema";
import { Event } from "../types/Event";
import { Events, Guild } from "discord.js";

const GuildCreate: Event = {
  name: Events.GuildCreate,
  once: false,
  async execute(guild: Guild) {
    console.info(`Joined guild ${guild.id}.`)

    const guildConfig = await bot.drizzle.select().from(guilds).where(eq(guilds.id, Number(guild.id)));
    if (guildConfig.length > 0) {
      console.info("Guild entry found in database. Skipping configuration.")
      return;
    }

    bot.drizzle.insert(guilds).values({ id: Number(guild.id) }).then(() => {
      console.info("Guild configured.")
    }).catch(error => {
      console.error(`Error while configuring guild: ${error}`);
    });
  }
}

export default GuildCreate;
