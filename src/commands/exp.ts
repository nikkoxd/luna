import {
	ChatInputCommandInteraction,
	MessageFlags,
	SlashCommandBuilder,
} from "discord.js";
import { Command } from "../base/Command";
import { bot } from "..";
import { members } from "../schema";
import i18next from "i18next";
import { sql } from "drizzle-orm";

export default class ExpCommand extends Command {
	constructor() {
		super(
			new SlashCommandBuilder()
				.setName("exp")
				.setDescription("Commands related to experience")
				.setDescriptionLocalization("ru", "Команды связанные с опытом")
				.addSubcommand((subcommand) =>
					subcommand
						.setName("set")
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
		);
	}

	async set(interaction: ChatInputCommandInteraction) {
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

	async execute(interaction: ChatInputCommandInteraction) {
		const subcommand = interaction.options.getSubcommand();
		switch (subcommand) {
			case "set": {
				this.set(interaction);
				break;
			}
		}
	}
}
