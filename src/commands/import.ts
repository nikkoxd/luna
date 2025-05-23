import { ActionRowBuilder, ButtonBuilder, ButtonStyle, ChatInputCommandInteraction, MessageFlags, PermissionFlagsBits, SlashCommandBuilder, TextDisplayBuilder } from "discord.js";
import { Command } from "../types/Command";
import { bot } from "..";
import { members } from "../schema";
import { z } from "zod";

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

      const response = await fetch(file.url);
      const membersJSON = await response.json();

      const mongoSchema = z.array(
        z.object({
          _id: z.object({
            $oid: z.string(),
          }),
          memberId: z.string(),
          coins: z.number(),
          roles: z.array(z.object({
            guildId: z.string(),
            roleId: z.string(),
            expiryDate: z.number(),
          })),
          __v: z.number(),
          exp: z.number(),
          level: z.number(),
          rooms: z.array(z.string()).optional(),
        })
      );
      const parsedMembers = mongoSchema.safeParse(membersJSON);

      if (!parsedMembers.success) {
        interaction.reply({ content: "Invalid JSON format. Use only with data exported from MongoDB.", flags: [MessageFlags.Ephemeral] });
        return;
      }
      await interaction.reply({ content: "Importing data...", flags: [MessageFlags.Ephemeral] });

      if (parsedMembers.data) {
        const text = [
          `About to import **${parsedMembers.data.length} members** to guild ${interaction.guild?.name}.`,
          `Are you sure you want to continue?`,
        ].join("\n");

        const actionRow = new ActionRowBuilder<ButtonBuilder>()

        const confirmButton = new ButtonBuilder()
          .setLabel("Confirm")
          .setStyle(ButtonStyle.Danger)
          .setCustomId("confirm");
        actionRow.addComponents(confirmButton);

        const response = await interaction.editReply({
          content: text,
          components: [actionRow],
        });

        try {
          const confirmation = await response.awaitMessageComponent({
            filter: i => i.user.id === interaction.user.id,
            time: 60_000,
          })

          if (confirmation.customId === "confirm") {
            for (const member of parsedMembers.data) {
              try {
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
              } catch (error) {
                confirmation.reply({ content: `Error importing member ${member.memberId}: ${error}`, flags: [MessageFlags.Ephemeral] });
                return;
              }
            }
          }

          confirmation.reply({ content: "Imported data from MongoDB.", flags: [MessageFlags.Ephemeral] });
        } catch {
          interaction.editReply({ content: "Import cancelled.", components: [] });
        }
      }
    }
  }
}

export default ImportCommand;
