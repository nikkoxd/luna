import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import { Command } from "../base/Command";
import { bot } from "..";
import { members } from "../schema";
import { eq } from "drizzle-orm";
import i18next from "i18next";

export default class BalanceCommand extends Command {
    constructor() {
        super(new SlashCommandBuilder()
            .setName("balance")
            .setDescription("Check your balance")
            .setDescriptionLocalization("ru", "Проверить баланс")
        )
    }

    async execute(interaction: ChatInputCommandInteraction): Promise<void> {
        try {
            const [user] = await bot.drizzle
                .select({ balance: members.balance })
                .from(members)
                .where(eq(members.id, BigInt(interaction.user.id)));

            interaction.reply({
                content: i18next.t(
                    "command.balance.reply.balance",
                    { balance: user.balance, lng: interaction.locale }
                )
            })
        } catch (error) {
            interaction.reply({
                content: i18next.t(
                    "command.balance.reply.balance",
                    { balance: 0, lng: interaction.locale }
                )
            })
        }
    }
}
