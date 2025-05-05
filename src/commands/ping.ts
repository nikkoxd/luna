import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import { Command } from "../interfaces/Command";

const PingCommand: Command = {
  data: new SlashCommandBuilder()
    .setName("ping")
    .setDescription("Pong!"),

  async execute(interaction: ChatInputCommandInteraction) {
    interaction.reply(`Pong! ${interaction.client.ws.ping} ms`);
  }
};

export default PingCommand;
