import { SlashCommandBuilder, SlashCommandOptionsOnlyBuilder } from "discord.js";

export interface Command {
  data: SlashCommandBuilder | SlashCommandOptionsOnlyBuilder;
  execute(...args: any[]): any;
}
