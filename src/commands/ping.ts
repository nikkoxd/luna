import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import { Command } from "../types/Command";
import i18next from "i18next";
import { bot } from "..";

const PingCommand: Command = {
  data: new SlashCommandBuilder()
    .setName("ping")
    .setDescription("Pong!"),

  async execute(interaction: ChatInputCommandInteraction) {
    const ping = bot.client.ws.ping;
    interaction.reply(i18next.t("command.ping.reply", {
      ping: ping,
      lng: interaction.locale,
    }));
  }
};

export default PingCommand;
