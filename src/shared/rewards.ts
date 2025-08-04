import { GuildMember } from "discord.js";
import { bot } from "..";
import { roles } from "../schema";
import { and, asc, eq } from "drizzle-orm";

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
