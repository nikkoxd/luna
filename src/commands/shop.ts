import {
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
	ChatInputCommandInteraction,
	Colors,
	EmbedBuilder,
	MessageFlags,
	PermissionFlagsBits,
	SlashCommandBuilder,
} from "discord.js";
import { Command } from "../base/Command";
import { bot } from "..";
import { roles } from "../schema";
import i18next from "i18next";
import { and, eq } from "drizzle-orm";

export default class ShopCommand extends Command {
	constructor() {
		super(
			new SlashCommandBuilder()
				.setName("shop")
				.setDescription("Shop related commands")
				.setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
				.addSubcommand((subcommand) =>
					subcommand
						.setName("send")
						.setDescription("Send the shop embed")
				)
				.addSubcommand((subcommand) =>
					subcommand
						.setName("add")
						.setDescription("Add an item to the shop")
						.addRoleOption((option) =>
							option
								.setName("role")
								.setDescription("The role to add")
								.setRequired(true)
						)
						.addNumberOption((option) =>
							option
								.setName("price")
								.setDescription("The price of the item")
								.setRequired(true)
						)
				)
				.addSubcommand((subcommand) =>
					subcommand
						.setName("list")
						.setDescription("List the items in the shop")
				)
				.addSubcommand((subcommand) =>
					subcommand
						.setName("remove")
						.setDescription("Remove an item from the shop")
						.addRoleOption((option) =>
							option
								.setName("role")
								.setDescription("The role to remove")
								.setRequired(true)
						)
				)
		);
	}

	async send(interaction: ChatInputCommandInteraction) {
		const embed = new EmbedBuilder()
			.setTitle(
				i18next.t("command.shop.initial.title", {
					lng: interaction.locale,
				})
			)
			.setDescription(
				i18next.t("command.shop.initial.description", {
					lng: interaction.locale,
				})
			)
			.setColor(Colors.LuminousVividPink);

		const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
			new ButtonBuilder()
				.setLabel(
					i18next.t("command.shop.initial.open", {
						lng: interaction.locale,
					})
				)
				.setStyle(ButtonStyle.Primary)
				.setCustomId("open")
		);

		if (!interaction.channel?.isSendable()) {
			interaction.reply({
				content: i18next.t("command.shop.initial.not_sendable", {
					lng: interaction.locale,
				}),
				flags: [MessageFlags.Ephemeral],
			});
			return;
		}

		interaction.channel.send({
			embeds: [embed],
			components: [row],
		});

		interaction.reply({
			content: i18next.t("command.shop.initial.sent", {
				lng: interaction.locale,
			}),
			flags: [MessageFlags.Ephemeral],
		});
	}

	async add(interaction: ChatInputCommandInteraction) {
		const role = interaction.options.getRole("role", true);
		const price = interaction.options.getNumber("price", true);

		if (!interaction.guildId) return;

		try {
			await bot.drizzle.insert(roles).values({
				id: BigInt(role.id),
				guildId: BigInt(interaction.guildId),

				isPurchaseable: true,
				price: price,
			});

			interaction.reply({
				content: i18next.t("command.shop.reply.added", {
					roleId: role.id,
					price,
					lng: interaction.locale,
				}),
				flags: [MessageFlags.Ephemeral],
			});
		} catch {
			interaction.reply({
				content: i18next.t("command.shop.reply.role_exists", {
					lng: interaction.locale,
				}),
				flags: [MessageFlags.Ephemeral],
			});
			return;
		}
	}

	async list(interaction: ChatInputCommandInteraction) {
		if (!interaction.guildId) return;

		try {
			const rolesList = await bot.drizzle
				.select()
				.from(roles)
				.where(eq(roles.guildId, BigInt(interaction.guildId)));

			const embed = new EmbedBuilder()
				.setTitle(
					i18next.t("command.shop.reply.items", {
						lng: interaction.locale,
					})
				)
				.setDescription(
					rolesList
						.map((role) => {
							const roleName = interaction.guild?.roles.cache.get(
								role.id.toString()
							)?.name;
							return `${roleName} - ${role.price}$`;
						})
						.join("\n")
				)
				.setColor(Colors.LuminousVividPink);

			interaction.reply({
				embeds: [embed],
				flags: [MessageFlags.Ephemeral],
			});
		} catch {
			interaction.reply({
				content: i18next.t("command.shop.reply.no_items", {
					lng: interaction.locale,
				}),
				flags: [MessageFlags.Ephemeral],
			});
		}
	}

	async remove(interaction: ChatInputCommandInteraction) {
		const role = interaction.options.getRole("role", true);

		if (!interaction.guildId) return;

		try {
			const result = await bot.drizzle
				.delete(roles)
				.where(
					and(
						eq(roles.guildId, BigInt(interaction.guildId)),
						eq(roles.id, BigInt(role.id))
					)
				)
				.returning();

			if (!result.length) {
				interaction.reply({
					content: i18next.t("command.shop.reply.role_not_found", {
						lng: interaction.locale,
					}),
					flags: [MessageFlags.Ephemeral],
				});
				return;
			}

			interaction.reply({
				content: i18next.t("command.shop.reply.removed", {
					roleId: role.id,
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

	async execute(interaction: ChatInputCommandInteraction): Promise<void> {
		const subcommand = interaction.options.getSubcommand();

		switch (subcommand) {
			case "send": {
				this.send(interaction);
				break;
			}
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
