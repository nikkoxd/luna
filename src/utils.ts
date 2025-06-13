import { eq } from "drizzle-orm";
import { bot } from ".";
import { guilds } from "./schema";
import { Colors, EmbedBuilder, GuildMember } from "discord.js";
import i18next from "i18next";

export async function getGuildLocale(guildId: string): Promise<string> {
	const [config] = await bot.drizzle
		.select({ locale: guilds.locale })
		.from(guilds)
		.where(eq(guilds.id, BigInt(guildId)));

	if (!config.locale) return "en";
	return config.locale;
}

export async function sendLog(
	guildId: string,
	action: string,
	message: string,
	messageArgs?: string[],
	responsibleMember?: GuildMember,
	targetMember?: GuildMember,
	language: string = "en"
) {
	try {
		const [config] = await bot.drizzle
			.select({ logChannelId: guilds.logChannelId })
			.from(guilds)
			.where(eq(guilds.id, BigInt(guildId)));

		if (!config.logChannelId) {
			return;
		}

		const embed = new EmbedBuilder()
			.setColor(Colors.Purple)
			.setTitle(i18next.t(action, { lng: language }))
			.setDescription(
				i18next.t(message, { ...messageArgs, lng: language })
			);

		if (responsibleMember) {
			embed.addFields({
				name: i18next.t("log.responsible", { lng: language }),
				value: `${responsibleMember.user.tag} (${responsibleMember.user.id})`,
			});
		}

		if (targetMember) {
			embed.addFields({
				name: i18next.t("log.target", { lng: language }),
				value: `${targetMember.user.tag} (${targetMember.user.id})`,
			});
		}

		const guild = await bot.client.guilds.fetch(guildId);
		if (!guild) {
			return;
		}

		const channel = await guild.channels.fetch(
			config.logChannelId.toString()
		);
		if (!channel || !channel.isSendable()) {
			return;
		}

		await channel.send({ embeds: [embed] });
	} catch (error) {
		bot.logger.error(error);
	}
}
