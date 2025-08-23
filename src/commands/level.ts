import {
	AttachmentBuilder,
	ChatInputCommandInteraction,
	SlashCommandBuilder,
	User,
} from "discord.js";

import {
	Canvas,
	SKRSContext2D,
	createCanvas,
	loadImage,
} from "@napi-rs/canvas";
import { and, eq } from "drizzle-orm";
import i18next from "i18next";

import { bot } from "..";
import { Command } from "../base/Command";
import { members } from "../schema";
import { levelToExp } from "../shared/conversions";

export default class ProfileCommand extends Command {
	constructor() {
		super(
			new SlashCommandBuilder()
				.setName("level")
				.setDescription("View member's level")
				.setDescriptionLocalization(
					"ru",
					"Просмотр уровня пользователя"
				)
				.addUserOption((option) =>
					option
						.setName("member")
						.setDescription("The member to view level of")
						.setDescriptionLocalization(
							"ru",
							"Участник для просмотра уровня"
						)
				)
		);
	}

	private async drawBackround(
		canvas: Canvas,
		ctx: SKRSContext2D,
		user: User
	) {
		const bannerURL =
			user.bannerURL({
				extension: "png",
			});

		const banner = bannerURL && (await loadImage(bannerURL));

		ctx.save();
		if (banner) {
			ctx.filter = "blur(15px) brightness(0.4)";
			ctx.drawImage(
				banner,
				-15,
				-15,
				canvas.width + 30,
				canvas.height + 30
			);
		} else {
			if (user.hexAccentColor) {
				ctx.fillStyle = user.hexAccentColor;
			} else {
				ctx.fillStyle = "#232323";
			}
			ctx.fillRect(0, 0, canvas.width, canvas.height);
		}
		ctx.restore();
	}

	private async drawAvatarShadow(ctx: SKRSContext2D) {
		ctx.save();
		ctx.arc(100, 100, 75, 0, Math.PI * 2, true);
		ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
		ctx.shadowBlur = 25;
		ctx.shadowOffsetX = 10;
		ctx.shadowOffsetY = 10;
		ctx.fill();
		ctx.restore();
	}

	private async drawAvatar(ctx: SKRSContext2D, user: User) {
		const avatarURL = user.displayAvatarURL({
			extension: "png",
		});
		const avatar = await loadImage(avatarURL);

		ctx.save();
		ctx.beginPath();
		ctx.arc(100, 100, 75, 0, Math.PI * 2, true);
		ctx.closePath();
		ctx.clip();
		ctx.drawImage(avatar, 25, 25, 150, 150);
		ctx.restore();
	}

	private async drawText(
        interaction: ChatInputCommandInteraction,
        canvas: Canvas,
		ctx: SKRSContext2D,
        user: User,
		level: number,
		exp: number
	) {
		ctx.save();
        const avgColor = this.getAverageColor(ctx, canvas.width, canvas.height);
        const brightness = this.getBrightness(avgColor);
		ctx.fillStyle = brightness > 128 ? "#000000" : "#ffffff";

		// nickname
		const name = user.displayName;
		ctx.font = "48px Nata Sans";
		ctx.fillText(name, 220, canvas.height - 80);

		// level
		ctx.font = "36px Nata Sans";
		ctx.textAlign = "right";
		ctx.fillText(
			i18next.t("commands.level.level", {
				level: level,
				lng: interaction.locale,
			}),
			canvas.width - 40,
			60
		);

		// exp
		const currentExp = exp;
		const requiredExp = levelToExp(level + 1);
		ctx.font = "28px Nata Sans";
		ctx.fillText(
			`${currentExp}/${requiredExp}`,
			canvas.width - 40,
			canvas.height - 80
		);
		ctx.restore();
	}

    private async drawExpBar(
        canvas: Canvas,
		ctx: SKRSContext2D,
		level: number,
		exp: number
	) {
		const currentExp = exp;
		const requiredExp = levelToExp(level + 1);
        const avgColor = this.getAverageColor(ctx, canvas.width, canvas.height);
        const brightness = this.getBrightness(avgColor);

		ctx.save();
		ctx.fillStyle = brightness > 128 ? "rgba(0, 0, 0, 0.5)" : "rgba(255, 255, 255, 0.5)";
		ctx.fillRect(220, canvas.height - 50, canvas.width - 260, 10);
		ctx.fillStyle = brightness > 128 ? "#000000" : "#ffffff";
		ctx.fillRect(
			220,
			canvas.height - 50,
			Math.min((currentExp / requiredExp) * (canvas.width - 260), canvas.width - 260),
			10
		);
		ctx.restore();
	}

    private getAverageColor(ctx: SKRSContext2D, width: number, height: number) {
        const imageData = ctx.getImageData(0, 0, width, height);
        let r = 0, g = 0, b = 0;

        for (let i = 0; i < imageData.data.length; i += 4) {
            r += imageData.data[i];
            g += imageData.data[i + 1];
            b += imageData.data[i + 2];
        }

        const pixelCount = imageData.data.length / 4;
        return {
            r: Math.round(r / pixelCount),
            g: Math.round(g / pixelCount),
            b: Math.round(b / pixelCount),
        };
    }

    private getBrightness({ r, g, b }: { r: number; g: number; b: number }) {
        return (0.299 * r + 0.587 * g + 0.114 * b);
    }


	async execute(interaction: ChatInputCommandInteraction): Promise<void> {
		if (!interaction.inGuild()) throw new Error("Not in guild");

		let user = interaction.options.getUser("member");
		if (!user) {
			user = interaction.user;
		}
		await user.fetch();

		const canvas = createCanvas(700, 200);
		const ctx = canvas.getContext("2d");

		const result = await bot.db
			.select({ level: members.level, exp: members.exp })
			.from(members)
			.where(
				and(
					eq(members.id, BigInt(user.id)),
					eq(members.guildId, BigInt(interaction.guildId))
				)
			);
		const { level, exp } = result[0] || { level: 0, exp: 0 };

		await this.drawBackround(canvas, ctx, user);
		await this.drawAvatarShadow(ctx);
		await this.drawAvatar(ctx, user);
        await this.drawText(interaction, canvas, ctx, user, level, exp);
        await this.drawExpBar(canvas, ctx, level, exp);

		const attachment = new AttachmentBuilder(await canvas.encode("png"), {
			name: "profile.png",
		});

		await interaction.reply({
			files: [attachment],
		});
	}
}
