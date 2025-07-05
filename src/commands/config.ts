import {
	ChatInputCommandInteraction,
	MessageFlags,
	PermissionFlagsBits,
	SlashCommandBuilder,
} from "discord.js";

import { eq } from "drizzle-orm";
import i18next from "i18next";

import { bot } from "..";
import { Command } from "../base/Command";
import { guilds } from "../schema";

export default class ConfigCommand extends Command {
	constructor() {
		super(
			new SlashCommandBuilder()
				.setName("config")
				.setDescription("Commands related to bot configuration")
				.setDescriptionLocalization(
					"ru",
					"Команды связанные с конфигурацией бота"
				)
				.setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
				.addSubcommand((subcommand) =>
					subcommand
						.setName("view")
						.setDescription("View the bot configuration")
						.setDescriptionLocalization(
							"ru",
							"Просмотр конфигурации бота"
						)
				)
				.addSubcommand((subcommand) =>
					subcommand
						.setName("edit")
						.setDescription("Edit the bot configuration")
						.setDescriptionLocalization(
							"ru",
							"Изменить конфигурацию бота"
						)
						.addStringOption((option) =>
							option
								.setName("key")
								.setDescription("The option to configure")
								.setDescriptionLocalization(
									"ru",
									"Опция для изменения"
								)
								.addChoices(
									{ name: "Locale - en/ru", value: "locale" },
									{
										name: "Announce Joins - true/false",
										value: "announceJoins",
									},
									{
										name: "Join Message - string",
										value: "joinMessage",
									},
									{
										name: "Log channel - id/string",
										value: "logChannelId",
									},

									{
										name: "Min Exp - number",
										value: "minExp",
									},
									{
										name: "Max Exp - number",
										value: "maxExp",
									},
									{
										name: "Min Coins - number",
										value: "minCoins",
									},
									{
										name: "Max Coins - number",
										value: "maxCoins",
									}
								)
								.setRequired(true)
						)
						.addStringOption((option) =>
							option
								.setName("value")
								.setDescription("Option value")
								.setDescriptionLocalization(
									"ru",
									"Значение опции"
								)
								.setRequired(true)
						)
				)
		);
	}

	async view(interaction: ChatInputCommandInteraction) {
		if (!interaction.guildId)
			throw new Error("Interaction ran outside a guild");

		try {
			const [config] = await bot.drizzle
				.select()
				.from(guilds)
				.where(eq(guilds.id, BigInt(interaction.guildId)));

			if (!config) {
				await interaction.reply({
					content: i18next.t("command.config.reply.not_found", {
						lng: interaction.locale,
					}),
					flags: [MessageFlags.Ephemeral],
				});
				return;
			}

			await interaction.reply({
				content: i18next.t("command.config.reply.view", {
					config: JSON.stringify(
						config,
						(_key, value) =>
							typeof value === "bigint"
								? value.toString()
								: value,
						2
					),
					lng: interaction.locale,
					interpolation: { escapeValue: false },
				}),
				flags: [MessageFlags.Ephemeral],
			});
		} catch (error) {
			bot.logger.error(error);

			await interaction.reply({
				content: i18next.t("internal_error", {
					lng: interaction.locale,
				}),
			});
		}
	}

	async edit(interaction: ChatInputCommandInteraction) {
		if (!interaction.guildId)
			throw new Error("Interaction ran outside a guild");

		const key = interaction.options.getString("key", true);
		const value = interaction.options.getString("value", true);

		try {
			await bot.drizzle
				.update(guilds)
				.set({ [key]: value })
				.where(eq(guilds.id, BigInt(interaction.guildId)));

			await interaction.reply({
				content: i18next.t("command.config.reply.success", {
					key,
					value,
					lng: interaction.locale,
				}),
				flags: [MessageFlags.Ephemeral],
			});

			bot.logger.info(
				`Updated ${key} to ${value} in guild ${interaction.guildId}.`
			);
		} catch (error) {
			bot.logger.error(
				`Error while updating ${key} to ${value} in guild ${interaction.guildId}: ${error}`
			);

			await interaction.reply({
				content: i18next.t("command.config.reply.error", {
					error,
					key,
					value,
					lng: interaction.locale,
				}),
				flags: [MessageFlags.Ephemeral],
			});
		}
	}

	async execute(interaction: ChatInputCommandInteraction) {
		const subcommand = interaction.options.getSubcommand();
		switch (subcommand) {
			case "view": {
				await this.view(interaction);
				break;
			}
			case "edit": {
				await this.edit(interaction);
				break;
			}
		}
	}
}
