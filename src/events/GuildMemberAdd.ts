import { Events, GuildFeature, GuildMember } from "discord.js";

import { eq } from "drizzle-orm";
import i18next from "i18next";

import { bot } from "..";
import { Event } from "../base/Event";
import { guilds, members, users } from "../schema";
import { getGuildLocale } from "../shared/locale";

export default class GuildMemberAddEvent extends Event<Events.GuildMemberAdd> {
	constructor() {
		super(Events.GuildMemberAdd, false);
	}

	async execute(member: GuildMember) {
		await bot.db.transaction(async (tx) => {
			await tx
				.insert(users)
				.values({
					id: BigInt(member.user.id),
				})
				.onConflictDoNothing();

			await tx
				.insert(members)
				.values({
					id: BigInt(member.user.id),
					guildId: BigInt(member.guild.id),
				})
				.onConflictDoNothing();
		});

		if (
			member.guild.features.includes(
				GuildFeature.MemberVerificationGateEnabled
			) ||
			!member.guild.systemChannel
		)
			return;

		const [config] = await bot.db
			.select({ joinMessage: guilds.joinMessage })
			.from(guilds)
			.where(eq(guilds.id, BigInt(member.guild.id)));

		let message: string;
		if (config?.joinMessage) {
			message = config.joinMessage
				.replace("{{displayname}}", member.user.displayName)
				.replace("{{username}}", member.user.username)
				.replace("{{mention}}", `<@${member.user.id}>`)
				.replace("{{guild}}", member.guild.name);
		} else {
			const locale = await getGuildLocale(member.guild.id);
			if (!locale) return;

			message = i18next.t("greeting", {
				guild: member.guild.name,
				memberId: member.user.id,
				lng: locale,
			});
		}

		member.guild.systemChannel.send(message);
	}
}
