import {
	ChatInputCommandInteraction,
	Colors,
	EmbedBuilder,
	MessageFlags,
	PermissionFlagsBits,
	SlashCommandBuilder,
} from "discord.js";

import { and, asc, eq } from "drizzle-orm";
import i18next from "i18next";

import { bot } from "..";
import { Command } from "../base/Command";
import { roles } from "../schema";

export default class RoleCommand extends Command {
	constructor() {
		super(
			new SlashCommandBuilder()
				.setName("reward")
				.setDescription("Commands related to rewards")
				.setDescriptionLocalization(
					"ru",
					"Команды связанные с наградами"
				)
				.setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
				.addSubcommand((subcommand) =>
					subcommand
						.setName("add")
						.setDescription("Add a role to rewards list")
						.setDescriptionLocalization(
							"ru",
							"Добавить роль в список наград"
						)
						.addRoleOption((option) =>
							option
								.setName("role")
								.setDescription("The role to add")
								.setDescriptionLocalization(
									"ru",
									"Роль для добавления в список наград"
								)
								.setRequired(true)
						)
						.addNumberOption((option) =>
							option
								.setName("level")
								.setDescription(
									"The level required to get the role"
								)
								.setDescriptionLocalization(
									"ru",
									"Уровень, требуемый для получения роли"
								)
								.setRequired(true)
						)
				)
				.addSubcommand((subcommand) =>
					subcommand
						.setName("list")
						.setDescription("List all rewards")
						.setDescriptionLocalization("ru", "Список всех наград")
				)
				.addSubcommand((subcommand) =>
					subcommand
						.setName("remove")
						.setDescription("Remove a role from rewards list")
						.setDescriptionLocalization(
							"ru",
							"Удалить роль из списка наград"
						)
						.addRoleOption((option) =>
							option
								.setName("role")
								.setDescription("The role to remove")
								.setDescriptionLocalization(
									"ru",
									"Роль, которую нужно удалить"
								)
								.setRequired(true)
						)
				)
		);
	}

	async add(interaction: ChatInputCommandInteraction) {
		const role = interaction.options.getRole("role", true);
		const level = interaction.options.getNumber("level", true);

		if (!interaction.guildId) return;

		const result = await bot.drizzle
			.insert(roles)
			.values({
				id: BigInt(role.id),
				guildId: BigInt(interaction.guildId),
				level: level,
			})
			.onConflictDoNothing()
			.returning();

		if (result.length === 0) {
			interaction.reply({
				content: i18next.t("command.role.reply.add_error", {
					lng: interaction.locale,
				}),
				flags: [MessageFlags.Ephemeral],
			});
			return;
		}

		await interaction.reply({
			content: i18next.t("command.role.reply.added", {
				lng: interaction.locale,
			}),
			flags: [MessageFlags.Ephemeral],
		});
	}

	async remove(interaction: ChatInputCommandInteraction) {
		const role = interaction.options.getRole("role", true);

		if (!interaction.guildId) return;

		const result = await bot.drizzle
			.delete(roles)
			.where(
				and(
					eq(roles.id, BigInt(role.id)),
					eq(roles.guildId, BigInt(interaction.guildId))
				)
			)
			.returning();

		if (result.length === 0) {
			interaction.reply({
				content: i18next.t("command.role.reply.removal_error", {
					lng: interaction.locale,
				}),
				flags: [MessageFlags.Ephemeral],
			});
			return;
		}

		await interaction.reply({
			content: i18next.t("command.role.reply.removed", {
				lng: interaction.locale,
			}),
			flags: [MessageFlags.Ephemeral],
		});
	}

	private async list(interaction: ChatInputCommandInteraction) {
		if (!interaction.guildId) return;

		try {
			const rolesList = await bot.drizzle
				.select({ id: roles.id, level: roles.level })
				.from(roles)
				.where(eq(roles.guildId, BigInt(interaction.guildId)))
                .orderBy(asc(roles.level));

            const embed = new EmbedBuilder()
                .setTitle(i18next.t("command.role.reply.list_title", {
                    lng: interaction.locale,
                }))
                .setColor(Colors.Purple)
                .setDescription(
                    rolesList
                        .map((role) => {
                            return i18next.t("command.role.reply.list_item", {
                                roleId: role.id.toString(),
                                roleLevel: role.level,
                                lng: interaction.locale,
                            });
                        })
                        .join("\n")
                );

			await interaction.reply({
				embeds: [embed],
				flags: [MessageFlags.Ephemeral],
			});
		} catch {
			await interaction.reply({
				content: i18next.t("command.role.reply.list_empty", {
					lng: interaction.locale,
				}),
				flags: [MessageFlags.Ephemeral],
			});
			return;
		}
	}

	async execute(interaction: ChatInputCommandInteraction) {
		const subcommand = interaction.options.getSubcommand();
		switch (subcommand) {
			case "add": {
				this.add(interaction);
				break;
			}
            case "list": {
                this.list(interaction);
                break;
            }
			case "remove": {
				this.remove(interaction);
				break;
			}
		}
	}
}
