import {
	ChatInputCommandInteraction,
	SlashCommandBuilder,
	SlashCommandOptionsOnlyBuilder,
	SlashCommandSubcommandsOnlyBuilder,
} from "discord.js";

export abstract class Command {
	public abstract execute(
		interaction: ChatInputCommandInteraction
	): Promise<void>;

	protected constructor(
		public data:
			| SlashCommandBuilder
			| SlashCommandOptionsOnlyBuilder
			| SlashCommandSubcommandsOnlyBuilder
	) {}
}
