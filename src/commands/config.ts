import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import { Command } from "../types/Command";
import { bot } from "..";
import { guilds } from "../schema";
import { eq } from "drizzle-orm";
import i18next from "i18next";

const ConfigCommand: Command = {
  data: new SlashCommandBuilder()
    .setName("config")
    .setDescription("Generate the bot's configuration"),

  async execute(interaction: ChatInputCommandInteraction) {
    if (!interaction.guildId) return;

    const locale = interaction.locale;
    const guildConfig = await bot.drizzle.select().from(guilds).where(eq(guilds.id, Number(interaction.guildId)));
    if (guildConfig.length > 0) {
      interaction.reply(i18next.t("command.config.reply.already_generated", { lng: locale }))
      return;
    }

    bot.drizzle.insert(guilds).values({ id: Number(interaction.guildId) }).returning().then(result => {
      console.log(result);
      interaction.reply(i18next.t("command.config.reply.success", {
        guild: interaction.guild!.name,
        lng: locale,
      }));
    }).catch(error => {
      console.error(error);
      interaction.reply(i18next.t("command.config.reply.error", {
        error: error,
        lng: locale,
      }));
    });
  }
}

export default ConfigCommand;
