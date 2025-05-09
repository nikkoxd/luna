import { ChatInputCommandInteraction, PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import { Command } from "../types/Command";
import { bot } from "..";
import { guilds } from "../schema";
import { eq } from "drizzle-orm";
import i18next from "i18next";

const ConfigCommand: Command = {
  data: new SlashCommandBuilder()
    .setName("config")
    .setDescription("Configure the bot")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addStringOption(option =>
      option
        .setName("key")
        .setDescription("The option to configure")
        .addChoices(
          { name: "Locale - en/ru", value: "locale" },
          { name: "Announce Joins - true/false", value: "announceJoins" },
        )
        .setRequired(true)
    )
    .addStringOption(option =>
      option
        .setName("value")
        .setDescription("Option value")
        .setRequired(true)
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    const locale = interaction.locale;

    if (!interaction.guildId) {
      interaction.reply(i18next.t("command.config.reply.only_on_servers", { lng: locale }));
      return;
    };

    const key = interaction.options.getString("key", true);
    const value = interaction.options.getString("value", true);

    bot.drizzle
      .update(guilds)
      .set({ [key]: value })
      .where(eq(guilds.id, Number(interaction.guildId)))
      .then(() => {
        bot.logger.info(`Updated ${key} to ${value} in guild ${interaction.guildId}.`);
        interaction.reply(i18next.t("command.config.reply.success", { key, value, lng: locale }));
      })
      .catch((error: Error) => {
        bot.logger.error(`Error while updating ${key} to ${value} in guild ${interaction.guildId}: ${error}`);
        interaction.reply(i18next.t("command.config.reply.error", { error, key, value, lng: locale }));
      })
  }
}

export default ConfigCommand;
