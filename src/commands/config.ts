import { ChatInputCommandInteraction, MessageFlags, PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import { Command } from "../base/Command";
import { bot } from "..";
import { guilds } from "../schema";
import { eq } from "drizzle-orm";
import i18next from "i18next";

export default class ConfigCommand extends Command {
  constructor() {
    super(new SlashCommandBuilder()
      .setName("config")
      .setDescription("Commands related to bot configuration")
      .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
      .addSubcommand(subcommand =>
        subcommand
          .setName("view")
          .setDescription("View the bot configuration")
      )
      .addSubcommand(subcommand =>
        subcommand
          .setName("edit")
          .setDescription("Edit the bot configuration")
          .addStringOption(option =>
            option
              .setName("key")
              .setDescription("The option to configure")
              .addChoices(
                { name: "Locale - en/ru", value: "locale" },
                { name: "Announce Joins - true/false", value: "announceJoins" },
                { name: "Join Message - string", value: "joinMessage" },
                { name: "Log channel - id/string", value: "logChannelId" },

                { name: "Min Exp - number", value: "minExp" },
                { name: "Max Exp - number", value: "maxExp" },
                { name: "Min Coins - number", value: "minCoins" },
                { name: "Max Coins - number", value: "maxCoins" },
              )
              .setRequired(true)
          )
          .addStringOption(option =>
            option
              .setName("value")
              .setDescription("Option value")
              .setRequired(true)
          ),
      ),
    )
  }

  async view(interaction: ChatInputCommandInteraction) {
    if (!interaction.guildId) return;

    const [config] = await bot.drizzle
      .select()
      .from(guilds)
      .where(eq(guilds.id, BigInt(interaction.guildId)));

    if (!config) {
      interaction.reply({
        content: i18next.t(
          "command.config.reply.not_found",
          { lng: interaction.locale }
        ),
        flags: [MessageFlags.Ephemeral],
      });
      return;
    }

    interaction.reply({
      content: i18next.t(
        "command.config.reply.view",
        {
          config: JSON.stringify(
            config,
            (_key, value) => typeof value === "bigint" ? value.toString() : value,
            2
          ),
          lng: interaction.locale,
          interpolation: { escapeValue: false },
        }
      ),
      flags: [MessageFlags.Ephemeral],
    })
  }

  async edit(interaction: ChatInputCommandInteraction) {
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
      .where(eq(guilds.id, BigInt(interaction.guildId)))
      .then(() => {
        bot.logger.info(`Updated ${key} to ${value} in guild ${interaction.guildId}.`);
        interaction.reply({
          content: i18next.t(
            "command.config.reply.success",
            { key, value, lng: locale }
          ),
          flags: [MessageFlags.Ephemeral]
        });
      })
      .catch((error: Error) => {
        bot.logger.error(`Error while updating ${key} to ${value} in guild ${interaction.guildId}: ${error}`);
        interaction.reply({
          content: i18next.t(
            "command.config.reply.error",
            { error, key, value, lng: locale }
          ),
          flags: [MessageFlags.Ephemeral]
        });
      })
  }

  async execute(interaction: ChatInputCommandInteraction) {
    const subcommand = interaction.options.getSubcommand();
    switch (subcommand) {
      case "view": {
        this.view(interaction);
        break;
      }
      case "edit": {
        this.edit(interaction);
        break;
      }
    }
  }
}
