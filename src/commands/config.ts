import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import { Command } from "../types/Command";
import { bot } from "..";

const ConfigCommand: Command = {
  data: new SlashCommandBuilder()
    .setName("config")
    .setDescription("Generate the bot's configuration"),

  async execute(interaction: ChatInputCommandInteraction) {
    if (!interaction.guildId) return;

    const guildConfig = await bot.pool.query("select * from guilds where id = $1;", [interaction.guildId]);
    if (guildConfig.rows.length > 0) return;

    bot.pool.query("insert into guilds (id) values ($1) returning *;", [interaction.guildId]).then(result => {
      console.log(result.rows[0]);
      interaction.reply(`Configuration generated for ${interaction.guild!.name}`);
    }).catch(error => {
      console.error(error);
      interaction.reply(`Error: ${error}`);
    })
  }
}

export default ConfigCommand;
