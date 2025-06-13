import {
	ChatInputCommandInteraction,
	SlashCommandBuilder,
	SlashCommandOptionsOnlyBuilder,
	SlashCommandSubcommandsOnlyBuilder,
} from "discord.js";

export abstract class Command {
	public data:
		| SlashCommandBuilder
		| SlashCommandOptionsOnlyBuilder
		| SlashCommandSubcommandsOnlyBuilder;
	public abstract execute(
		interaction: ChatInputCommandInteraction
	): Promise<void>;

	protected constructor(
		data:
			| SlashCommandBuilder
			| SlashCommandOptionsOnlyBuilder
			| SlashCommandSubcommandsOnlyBuilder
	) {
		this.data = data;
	}
}
