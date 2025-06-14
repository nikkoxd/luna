import {
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
	ChatInputCommandInteraction,
	MessageFlags,
	PermissionFlagsBits,
	SlashCommandBuilder,
} from "discord.js";

import i18next from "i18next";
import { z } from "zod";

import { bot } from "..";
import { Command } from "../base/Command";
import { members, users } from "../schema";

export default class ImportCommand extends Command {
	constructor() {
		super(
			new SlashCommandBuilder()
				.setName("import")
				.setDescription("Import data")
				.setDescriptionLocalization("ru", "Импортировать данные")
				.setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
				.addSubcommand((subcommand) =>
					subcommand
						.setName("mongodb")
						.setDescription("Import from MongoDB")
						.setDescriptionLocalization("ru", "Импорт из MongoDB")
						.addAttachmentOption((option) =>
							option
								.setName("file")
								.setDescription("JSON to import data from")
								.setDescriptionLocalization(
									"ru",
									"Данные в формате JSON"
								)
								.setRequired(true)
						)
				)
		);
	}

	async confirm(interaction: ChatInputCommandInteraction) {
		if (!interaction.guildId) return;
		const file = interaction.options.getAttachment("file", true);

		if (!file.contentType?.startsWith("application/json")) {
			interaction.reply({
				content: i18next.t("command.import.reply.invalid_file_type", {
					lng: interaction.locale,
				}),
				flags: [MessageFlags.Ephemeral],
			});
			return;
		}

		const response = await fetch(file.url);
		const membersJSON = await response.json();

		const mongoSchema = z.array(
			z.object({
				_id: z.object({
					$oid: z.string(),
				}),
				memberId: z.string(),
				coins: z.number(),
				roles: z
					.array(
						z.object({
							guildId: z.string(),
							roleId: z.string(),
							expiryDate: z.number(),
						})
					)
					.optional(),
				__v: z.number(),
				exp: z.number().optional(),
				level: z.number().optional(),
				rooms: z.array(z.string()).optional(),
			})
		);
		const parsedMembers = mongoSchema.safeParse(membersJSON);

		if (!parsedMembers.success) {
			interaction.reply({
				content: i18next.t("command.import.reply.invalid_json_format", {
					lng: interaction.locale,
				}),
				flags: [MessageFlags.Ephemeral],
			});
			return;
		}

		if (parsedMembers.data) {
			const text = i18next.t("command.import.reply.confirmation", {
				amount: parsedMembers.data.length,
				guild: interaction.guild?.name,
				lng: interaction.locale,
			});

			const actionRow = new ActionRowBuilder<ButtonBuilder>();

			const confirmButton = new ButtonBuilder()
				.setLabel(
					i18next.t("command.import.reply.confirm", {
						lng: interaction.locale,
					})
				)
				.setStyle(ButtonStyle.Danger)
				.setCustomId("confirm");
			actionRow.addComponents(confirmButton);

			const response = await interaction.reply({
				content: text,
				components: [actionRow],
				flags: [MessageFlags.Ephemeral],
			});

			try {
				const confirmation = await response.awaitMessageComponent({
					filter: (i) => i.user.id === interaction.user.id,
					time: 60_000,
				});

				if (confirmation.customId === "confirm") {
					confirmation.reply({
						content: i18next.t(
							"command.import.reply.importing_data",
							{ lng: interaction.locale }
						),
						flags: [MessageFlags.Ephemeral],
					});

					for (const member of parsedMembers.data) {
						try {
							await bot.drizzle.transaction(async (tx) => {
								await tx
									.insert(users)
									.values({
										id: BigInt(member.memberId),
									})
									.onConflictDoNothing();

								await tx
									.insert(members)
									.values({
										id: BigInt(member.memberId),
										guildId: BigInt(interaction.guildId!),
										exp: member.exp,
										balance: member.coins,
									})
									.onConflictDoUpdate({
										target: [members.id, members.guildId],
										set: {
											exp: member.exp,
											balance: member.coins,
										},
									});
							});
						} catch (error) {
							confirmation.editReply({
								content: i18next.t(
									"command.import.reply.error_importing_member",
									{
										memberId: member.memberId,
										error,
										lng: interaction.locale,
									}
								),
							});
							return;
						}
					}
				}

				confirmation.editReply({
					content: i18next.t("command.import.reply.import_finished", {
						lng: interaction.locale,
					}),
				});
			} catch {
				interaction.editReply({
					content: i18next.t("command.import.reply.cancelled", {
						lng: interaction.locale,
					}),
					components: [],
				});
			}
		}
	}

	async execute(interaction: ChatInputCommandInteraction) {
		const ownerId =
			process.env.OWNER_ID || bot.client.application?.owner?.id;
		if (interaction.user.id !== ownerId) {
			interaction.reply({
				content: i18next.t("developer-only", {
					lng: interaction.locale,
				}),
				flags: [MessageFlags.Ephemeral],
			});
		}

		const subcommand = interaction.options.getSubcommand();

		switch (subcommand) {
			case "mongodb": {
				this.confirm(interaction);
				break;
			}
		}
	}
}
