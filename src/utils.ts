import { EmbedBuilder, GuildMember } from "discord.js";

import { and, asc, eq } from "drizzle-orm";
import i18next from "i18next";

import { bot } from ".";
import { guilds, roles } from "./schema";

export async function getGuildLocale(guildId: string): Promise<string> {
	const [config] = await bot.db
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
		const [config] = await bot.db
			.select({ logChannelId: guilds.logChannelId })
			.from(guilds)
			.where(eq(guilds.id, BigInt(guildId)));

		if (!config.logChannelId) {
			return;
		}

		const embed = new EmbedBuilder()
			.setColor(bot.config.color)
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

export async function processRewards(member: GuildMember, level: number) {
	try {
		const result = await bot.db
			.select({ id: roles.id, level: roles.level })
			.from(roles)
			.where(and(eq(roles.guildId, BigInt(member.guild.id))))
			.orderBy(asc(roles.level));

		const currentLevelRole = result.find((role) => role.level === level);
		if (!currentLevelRole) throw new Error("Current level role not found");

		for (const role of result) {
			const guildRole = member.guild.roles.cache.get(role.id.toString());
			if (!guildRole) continue;

			await member.roles.remove(guildRole);
		}

		const currentLevelGuildRole = member.guild.roles.cache.get(
			currentLevelRole.id.toString()
		);
		if (!currentLevelGuildRole)
			throw new Error("Current level role not found");

		await member.roles.add(currentLevelGuildRole);
	} catch (error) {
		bot.logger.error(error);
	}
}

export function getRequiredExp(level: number) {
	return 12.5 * (Math.pow(2 * level + 1, 2) - 1);
}

export function getLevel(exp: number) {
	return Math.floor((Math.sqrt((4 * exp) / 50 + 1) - 1) / 2);
}
