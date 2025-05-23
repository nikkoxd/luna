import { ChatInputCommandInteraction, PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import { Command } from "../types/Command";
import { MongoDBMember } from "../types/MongoDBMember";
import { bot } from "..";
import { members } from "../schema";

const ImportCommand: Command = {
  data: new SlashCommandBuilder()
    .setName("import")
    .setDescription("Import data")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand(subcommand =>
      subcommand
        .setName("mongodb")
        .setDescription("Import from MongoDB")
        .addAttachmentOption(option =>
          option
            .setName("file")
            .setDescription("JSON to import data from")
            .setRequired(true)
        )
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    if (interaction.options.getSubcommand() === "mongodb") {
      const file = interaction.options.getAttachment("file", true);

      if (!file.contentType?.startsWith("application/json")) {
        interaction.reply("Invalid file type. Please upload a JSON file.");
        return;
      }
      interaction.reply("Importing data...");

      const response = await fetch(file.url);
      const unparsedData = await response.json();
      const data: MongoDBMember[] = JSON.parse(unparsedData);

      for (const member of data) {
        await bot.drizzle
          .insert(members)
          .values({
            id: Number(member.memberId),
            guildId: Number(interaction.guildId),
            exp: member.exp,
            balance: member.coins,
          })
          .onConflictDoUpdate({
            target: [members.id, members.guildId],
            set: { exp: member.exp, balance: member.coins },
          })
      }

      interaction.editReply("Imported data from MongoDB.");
    }
  }
}

export default ImportCommand;
