import {
	ActionRowBuilder,
	ButtonBuilder,
	ButtonInteraction,
	ButtonStyle,
	ComponentType,
	EmbedBuilder,
	Events,
	Interaction,
	MessageFlags,
	StringSelectMenuBuilder,
	StringSelectMenuOptionBuilder,
} from "discord.js";

import { eq } from "drizzle-orm";
import i18next from "i18next";

import { bot } from "..";
import { Event } from "../base/Event";
import { members, roles } from "../schema";

export default class ButtonInteractionEvent extends Event<Events.InteractionCreate> {
	constructor() {
		super(Events.InteractionCreate);
	}

	private async openShop(interaction: ButtonInteraction) {
		if (!interaction.inCachedGuild()) return;

		const rolesPerPage = 10;

		try {
			const rolesList = await bot.db
				.select({ id: roles.id, price: roles.price })
				.from(roles)
				.where(eq(roles.guildId, BigInt(interaction.guildId)));

			let page = 1;

			const message = await this.getMessage(
				interaction,
				rolesList,
				rolesPerPage,
				page
			);

			const response = await interaction.reply({
				...message,
				withResponse: true,
				flags: [MessageFlags.Ephemeral],
			});
			const buttonInteractionCollector =
				response.resource?.message?.createMessageComponentCollector({
					componentType: ComponentType.Button,
					time: 60_000,
				});
			const selectInteractionCollector =
				response.resource?.message?.createMessageComponentCollector({
					componentType: ComponentType.StringSelect,
					time: 60_000,
				});

			buttonInteractionCollector?.on("collect", async (collected) => {
				const customId = collected.customId;

				switch (customId) {
					case "prev": {
						page--;
						const message = await this.getMessage(
							interaction,
							rolesList,
							rolesPerPage,
							page
						);
						await collected.update(message);
						break;
					}
					case "next": {
						page++;
						const message = await this.getMessage(
							interaction,
							rolesList,
							rolesPerPage,
							page
						);
						await collected.update(message);
						break;
					}
				}
			});

			selectInteractionCollector?.on("collect", async (collected) => {
				if (collected.customId === "role") {
					const roleId = collected.values[0];
					const price = rolesList.find(
						(role) => role.id === BigInt(roleId)
					)?.price;

					const [member] = await bot.db
						.select({ balance: members.balance })
						.from(members)
						.where(eq(members.id, BigInt(interaction.user.id)));

					if (member.balance < price!) {
						await collected.reply({
							content: i18next.t("shop.not_enough_coins", {
								price: price,
								lng: interaction.locale,
							}),
							flags: [MessageFlags.Ephemeral],
						});
						return;
					}

					try {
						await bot.db
							.update(members)
							.set({ balance: member.balance - price! })
							.where(eq(members.id, BigInt(interaction.user.id)));

						await interaction.member.roles.add(roleId);
					} finally {
						await collected.reply({
							content: i18next.t("shop.bought", {
								roleId,
								lng: interaction.locale,
							}),
							flags: [MessageFlags.Ephemeral],
						});
					}
				}
			});
		} catch (error) {
			bot.logger.error(error);
			return;
		}
	}

	private async getMessage(
		interaction: ButtonInteraction,
		rolesList: { id: bigint; price: number }[],
		rolesPerPage: number,
		page: number
	) {
		const totalPages = Math.ceil(rolesList.length / rolesPerPage);
		const currentPageRoles = rolesList.slice(
			(page - 1) * rolesPerPage,
			page * rolesPerPage
		);

		const embeds = [
			new EmbedBuilder()
				.setTitle(
					i18next.t("shop.title", {
						page: page,
						total: totalPages,
						lng: interaction.locale,
					})
				)
				.addFields(
					currentPageRoles.map((role) => {
						const roleName = interaction.guild?.roles.cache.get(
							role.id.toString()
						)?.name;
						return {
							name: roleName!,
							value: i18next.t("shop.role_value", {
								price: role.price,
								lng: interaction.locale,
							}),
                            inline: true,
						};
					})
				)
				.setColor(bot.config.color),
		];

		const components: (
			| ActionRowBuilder<StringSelectMenuBuilder>
			| ActionRowBuilder<ButtonBuilder>
		)[] = [
			new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
				new StringSelectMenuBuilder()
					.setCustomId("role")
					.setPlaceholder(
						i18next.t("shop.select_role", {
							lng: interaction.locale,
						})
					)
					.addOptions(
						currentPageRoles.map((role) => {
							const roleId = role.id.toString();
							const roleName =
								interaction.guild?.roles.cache.get(
									roleId
								)?.name;

							return new StringSelectMenuOptionBuilder()
								.setLabel(roleName || "Role name not found")
								.setValue(roleId);
						})
					)
			),
		];

		if (totalPages > 1) {
			const prevPageButton = new ButtonBuilder()
				.setLabel(
					i18next.t("shop.prev", {
						lng: interaction.locale,
					})
				)
				.setStyle(ButtonStyle.Primary)
				.setCustomId("prev");

			if (page === 1) {
				prevPageButton.setDisabled(true);
			}

			const nextPageButton = new ButtonBuilder()
				.setLabel(
					i18next.t("shop.next", {
						lng: interaction.locale,
					})
				)
				.setStyle(ButtonStyle.Primary)
				.setCustomId("next");

			if (page === totalPages) {
				nextPageButton.setDisabled(true);
			}

			components.push(
				new ActionRowBuilder<ButtonBuilder>().addComponents(
					prevPageButton,
					nextPageButton
				)
			);
		}

		return {
			embeds,
			components,
		};
	}

	public async execute(interaction: Interaction) {
		if (!interaction.isButton()) return;

		const button = interaction.customId;

		switch (button) {
			case "openShop": {
				this.openShop(interaction);
				break;
			}
		}
	}
}
