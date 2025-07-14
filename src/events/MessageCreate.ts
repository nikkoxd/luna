import { Collection, Events, Message } from "discord.js";

import { randomInt } from "crypto";
import { and, eq } from "drizzle-orm";
import i18next from "i18next";

import { bot } from "..";
import { Event } from "../base/Event";
import { guilds, members, users } from "../schema";
import { getGuildLocale, processRewards, updateMemberBalance, updateMemberExp, updateMemberLevel } from "../utils";

export default class MessageCreateEvent extends Event<Events.MessageCreate> {
	constructor() {
		super(Events.MessageCreate, false);
	}

	private cooldown = 5_000;
	private timestamps = new Collection<string, number>();

	private isOnCooldown(userId: string) {
		const timestamp = this.timestamps.get(userId);
		if (timestamp) {
			const expirationTime = timestamp + this.cooldown;

			if (Date.now() < expirationTime) {
				return true;
			}
		}
		this.timestamps.set(userId, Date.now());
		setTimeout(() => this.timestamps.delete(userId), this.cooldown);
		return false;
	}

	private async processMessage(message: Message): Promise<void> {
		if (!message.guild) {
			return;
		}

		const [config] = await bot.db
			.select({
				minExp: guilds.minExp,
				maxExp: guilds.maxExp,
				minCoins: guilds.minCoins,
				maxCoins: guilds.maxCoins,
			})
			.from(guilds)
			.where(eq(guilds.id, BigInt(message.guild.id)));

		const expToAdd = randomInt(config.minExp, config.maxExp);
		const balanceToAdd = randomInt(config.minCoins, config.maxCoins);

		await bot.db.transaction(async (tx) => {
			await tx
				.insert(users)
				.values({
					id: BigInt(message.author.id),
				})
				.onConflictDoNothing();

			const [beforeUpdateMember] = await tx
				.select({ level: members.level })
				.from(members)
				.where(
					and(
						eq(members.id, BigInt(message.author.id)),
						eq(members.guildId, BigInt(message.guild!.id))
					)
				);
			const previousLevel = beforeUpdateMember
				? beforeUpdateMember.level
				: 0;

			const [updatedMember] = await tx
				.insert(members)
				.values({
					id: BigInt(message.author.id),
					guildId: BigInt(message.guild!.id),
					exp: expToAdd,
					balance: balanceToAdd,
				})
				.onConflictDoUpdate({
					target: [members.id, members.guildId],
					set: {
						exp: updateMemberExp(expToAdd),
						balance: updateMemberBalance(balanceToAdd),
						level: updateMemberLevel(expToAdd),
					},
				})
				.returning({ level: members.level });

			const newLevel = updatedMember ? updatedMember.level : 0;

			if (newLevel > previousLevel) {
				if (!message.channel.isSendable()) return;

				await processRewards(message.member!, newLevel);
				message.channel.send(
					i18next.t("event.message_create.level_up", {
						userId: message.author.id,
						level: newLevel,
						lng: await getGuildLocale(message.guildId!),
					})
				);
			}
		});
	}

	public async execute(message: Message) {
		if (
			message.system ||
			message.author.bot ||
			!message.member ||
			!message.guild ||
			message.interactionMetadata
		) {
			return;
		}

		if (this.isOnCooldown(message.author.id)) {
			return;
		}

		try {
			await this.processMessage(message);
		} catch (error) {
			bot.logger.error(error);
		}
	}
}
