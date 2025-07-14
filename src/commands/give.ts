import {
	ChatInputCommandInteraction,
	MessageFlags,
	PermissionFlagsBits,
	SlashCommandBuilder,
} from "discord.js";

import { eq, sql } from "drizzle-orm";
import i18next from "i18next";

import { bot } from "..";
import { Command } from "../base/Command";
import { members } from "../schema";

export default class GiveCommand extends Command {
	constructor() {
		super(
			new SlashCommandBuilder()
				.setName("give")
				.setDescription("Give stuff to users")
                .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
				.addSubcommand((subcommand) =>
					subcommand
						.setName("coins")
						.setDescription("Give coins to user")
						.setDescriptionLocalization(
							"ru",
							"Дать монетки пользователю"
						)
						.addUserOption((option) =>
							option
								.setName("user")
								.setDescription("The user to give coins to")
								.setDescriptionLocalization(
									"ru",
									"Пользователь, которому нужно дать монетки"
								)
								.setRequired(true)
						)
						.addNumberOption((option) =>
							option
								.setName("amount")
								.setDescription("The amount of coins to give")
								.setDescriptionLocalization(
									"ru",
									"Количество монет, которые нужно дать"
								)
								.setRequired(true)
						)
				)
		);
	}

	async coins(interaction: ChatInputCommandInteraction): Promise<void> {
		const user = interaction.options.getUser("user", true);
		const amount = interaction.options.getNumber("amount", true);

		try {
			await bot.db
				.update(members)
				.set({ balance: sql`${members.balance} + ${amount}` })
				.where(eq(members.id, BigInt(user.id)));
		} catch (error) {
			bot.logger.error(error);

			await interaction.reply({
				content: i18next.t("command.give.coins.reply.error", {
					lng: interaction.locale,
				}),
				flags: [MessageFlags.Ephemeral],
			});
		} finally {
			await interaction.reply({
				content: i18next.t("command.give.coins.reply.success", {
					amount,
					userId: user.id,
					lng: interaction.locale,
				}),
				flags: [MessageFlags.Ephemeral],
			});
		}
	}

	async execute(interaction: ChatInputCommandInteraction): Promise<void> {
		const subcommand = interaction.options.getSubcommand();
		switch (subcommand) {
			case "coins": {
				await this.coins(interaction);
				break;
			}
		}
	}
}
