import {
	ChatInputCommandInteraction,
	MessageFlags,
	SlashCommandBuilder,
} from "discord.js";

import { sql } from "drizzle-orm";
import i18next from "i18next";
import { level } from "winston";

import { bot } from "..";
import { Command } from "../base/Command";
import { members } from "../schema";

export default class ExpCommand extends Command {
	constructor() {
		super(
			new SlashCommandBuilder()
				.setName("set")
				.setDescription("Commands for setting exp/level/balance")
				.setDescriptionLocalization(
					"ru",
					"Команды для выдачи опыта/уровня/баланса"
				)
				.addSubcommand((subcommand) =>
					subcommand
						.setName("exp")
						.setDescription("Set member's experience")
						.setDescriptionLocalization(
							"ru",
							"Установить опыт участника"
						)
						.addUserOption((option) =>
							option
								.setName("member")
								.setDescription(
									"The member to set experience for"
								)
								.setDescriptionLocalization(
									"ru",
									"Участник, для которого нужно установить опыт"
								)
								.setRequired(true)
						)
						.addNumberOption((option) =>
							option
								.setName("exp")
								.setDescription(
									"The amount of experience to set"
								)
								.setDescriptionLocalization(
									"ru",
									"Количество опыта"
								)
								.setRequired(true)
						)
				)
				.addSubcommand((subcommand) =>
					subcommand
						.setName("level")
						.setDescription("Set member's level")
						.setDescriptionLocalization(
							"ru",
							"Установить уровень участника"
						)
						.addUserOption((option) =>
							option
								.setName("member")
								.setDescription("The member to set level for")
								.setDescriptionLocalization(
									"ru",
									"Участник, для которого нужно установить уровень"
								)
								.setRequired(true)
						)
						.addNumberOption((option) =>
							option
								.setName("level")
								.setDescription("The level to set")
								.setDescriptionLocalization("ru", "Уровень")
								.setRequired(true)
						)
				)
		);
	}

	private async exp(interaction: ChatInputCommandInteraction) {
		const member = interaction.options.getUser("member", true);
		const exp = interaction.options.getNumber("exp", true);

		if (!interaction.guildId) return;

		const result = await bot.drizzle
			.insert(members)
			.values({
				id: BigInt(member.id),
				guildId: BigInt(interaction.guildId),
				exp: exp,
			})
			.onConflictDoUpdate({
				target: [members.id, members.guildId],
				set: {
					exp: exp,
					level: sql`FLOOR((SQRT(4 * ${exp} / 50 + 1) - 1) / 2)`,
				},
			})
			.returning();

		if (result.length === 0) {
			interaction.reply({
				content: i18next.t("command.exp.reply.set_error", {
					lng: interaction.locale,
				}),
				flags: [MessageFlags.Ephemeral],
			});
		}

		interaction.reply({
			content: i18next.t("command.exp.reply.success", {
				memberId: member.id,
				exp: exp,
				level: result[0].level,
				lng: interaction.locale,
			}),
			flags: [MessageFlags.Ephemeral],
		});
	}

	private async level(interaction: ChatInputCommandInteraction) {
		if (!interaction.guildId) return;

		try {
			const member = interaction.options.getUser("member", true);
			const level = interaction.options.getNumber("level", true);

			const result = await bot.drizzle
				.insert(members)
				.values({
					id: BigInt(member.id),
					guildId: BigInt(interaction.guildId),
					level: level,
				})
				.onConflictDoUpdate({
					target: [members.id, members.guildId],
					set: {
						level: level,
					},
				});

            interaction.reply({
                content: i18next.t("command.set.level.reply.success", {
                    memberId: member.id,
                    level: level,
                    lng: interaction.locale,
                }),
                flags: [MessageFlags.Ephemeral],
            });
		} catch (error) {
			bot.logger.error(error);

            interaction.reply({
                content: i18next.t("internal_error", {
                    lng: interaction.locale,
                }),
                flags: [MessageFlags.Ephemeral],
            });
		}
	}

	async execute(interaction: ChatInputCommandInteraction) {
		const subcommand = interaction.options.getSubcommand();
		switch (subcommand) {
			case "exp": {
				this.exp(interaction);
				break;
			}
			case "level": {
				this.level(interaction);
				break;
			}
		}
	}
}
