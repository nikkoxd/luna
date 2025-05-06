import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import { Command } from "../types/Command";
import { bot } from "..";
import { guilds } from "../schema";
import { eq } from "drizzle-orm";

const ConfigCommand: Command = {
  data: new SlashCommandBuilder()
    .setName("config")
    .setDescription("Generate the bot's configuration"),

  async execute(interaction: ChatInputCommandInteraction) {
    if (!interaction.guildId) return;

    const guildConfig = await bot.drizzle.select().from(guilds).where(eq(guilds.id, Number(interaction.guildId)));
    if (guildConfig.length > 0) {
      interaction.reply("No need to configure this server")
      return;
    }

    bot.drizzle.insert(guilds).values({ id: Number(interaction.guildId) }).returning().then(result => {
      console.log(result);
      interaction.reply(`Configuration generated for ${interaction.guild!.name}`);
    }).catch(error => {
      console.error(error);
      interaction.reply(`Error: ${error}`);
    });
  }
}

export default ConfigCommand;
