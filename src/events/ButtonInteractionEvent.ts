import { ActionRowBuilder, ButtonBuilder, ButtonInteraction, ButtonStyle, Colors, ComponentType, EmbedBuilder, Events, Interaction, MessageFlags, StringSelectMenuBuilder, StringSelectMenuInteraction, StringSelectMenuOptionBuilder } from "discord.js";
import { Event } from "../base/Event";
import { bot } from "..";
import { roles } from "../schema";
import { eq } from "drizzle-orm";
import i18next from "i18next";

export default class ButtonInteractionEvent extends Event<Events.InteractionCreate> {
    constructor() {
        super(Events.InteractionCreate);
    }

    async role(interaction: StringSelectMenuInteraction) {
        if (
            !interaction.guildId || !interaction.member
        ) return;


    }

    async open(interaction: ButtonInteraction) {
        if (!interaction.guildId) return;

        try {
            const rolesList = await bot.drizzle
                .select({ id: roles.id, price: roles.price })
                .from(roles)
                .where(eq(
                    roles.guildId,
                    BigInt(interaction.guildId)
                ));

            const embed = new EmbedBuilder()
                .setTitle(i18next.t("shop.title", { lng: interaction.locale }))
                .setDescription(
                    rolesList.map(role => {
                        const roleName = interaction.guild?.roles.cache.get(role.id.toString())?.name;
                        return `${roleName} - ${role.price}$`
                    }).join("\n")
                )
                .setColor(Colors.LuminousVividPink)

            const selectRow = new ActionRowBuilder<StringSelectMenuBuilder>()
                .addComponents(
                    new StringSelectMenuBuilder()
                        .setCustomId("role")
                        .setPlaceholder(i18next.t("shop.select_role", { lng: interaction.locale }))
                        .addOptions(
                            rolesList.map(role => {
                                const roleId = role.id.toString();
                                const roleName = interaction.guild?.roles.cache.get(roleId)?.name;

                                return new StringSelectMenuOptionBuilder()
                                    .setLabel(roleName || "Role name not found")
                                    .setValue(roleId)
                            })
                        )
                )

            const buttonRow = new ActionRowBuilder<ButtonBuilder>()
                .addComponents(
                    new ButtonBuilder()
                        .setLabel(i18next.t("shop.prev", { lng: interaction.locale }))
                        .setStyle(ButtonStyle.Primary)
                        .setCustomId("prev"),
                    new ButtonBuilder()
                        .setLabel(i18next.t("shop.next", { lng: interaction.locale }))
                        .setStyle(ButtonStyle.Primary)
                        .setCustomId("next")
                )

            const reply = await interaction.reply({
                embeds: [embed],
                components: [selectRow, buttonRow],
                flags: [MessageFlags.Ephemeral],
            })

            const collector = reply.createMessageComponentCollector({
                componentType: ComponentType.Button,
                time: 60_000
            })

            collector.on("collect", async (collected) => {
                switch (collected.customId) {
                    case "prev": {
                        // do stuff
                        break;
                    }
                    case "next": {
                        // do stuff
                        break;
                    }
                }
            })

            collector.on("end", async () => {
                selectRow.components.forEach(component => {
                    component.setDisabled(true)
                })
                buttonRow.components.forEach(component => {
                    component.setDisabled(true)
                })

                interaction.editReply({
                    components: [selectRow, buttonRow],
                })
            })
        } catch (error) {
            bot.logger.error(error);
            if (interaction.replied) {
                interaction.editReply({
                    content: i18next.t("internal_error", { lng: interaction.locale }),
                })
            } else {
                interaction.reply({
                    content: i18next.t("internal_error", { lng: interaction.locale }),
                    flags: [MessageFlags.Ephemeral],
                })
            }
        }
    }

    async execute(interaction: Interaction) {
        if (!interaction.isButton()) return;

        const button = interaction.customId;

        switch (button) {
            case "open": {
                this.open(interaction);
                break;
            }
        }
    }
}
