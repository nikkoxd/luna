import { ActionRowBuilder, ButtonBuilder, ButtonStyle, ChatInputCommandInteraction, MessageFlags, PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import { Command } from "../base/Command";
import { bot } from "..";
import { members } from "../schema";
import { z } from "zod";
import i18next from "i18next";

export default class ImportCommand extends Command {
  constructor() {
    super(new SlashCommandBuilder()
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
    )
  }

  async confirm(interaction: ChatInputCommandInteraction) {
    const file = interaction.options.getAttachment("file", true);

    if (!file.contentType?.startsWith("application/json")) {
      interaction.reply({
        content: i18next.t("command.import.reply.invalid_file_type", { lng: interaction.locale }),
        flags: [MessageFlags.Ephemeral],
      })
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
        })).optional(),
        __v: z.number(),
        exp: z.number().optional(),
        level: z.number().optional(),
        rooms: z.array(z.string()).optional(),
      })
    );
    const parsedMembers = mongoSchema.safeParse(membersJSON);

    if (!parsedMembers.success) {
      interaction.reply({
        content: i18next.t("command.import.reply.invalid_json_format", { lng: interaction.locale }),
        flags: [MessageFlags.Ephemeral],
      })
      return;
    }

    if (parsedMembers.data) {
      const text = i18next.t("command.import.reply.confirmation", {
        amount: parsedMembers.data.length,
        guild: interaction.guild?.name,
        lng: interaction.locale,
      });

      const actionRow = new ActionRowBuilder<ButtonBuilder>()

      const confirmButton = new ButtonBuilder()
        .setLabel(i18next.t("command.import.reply.confirm", { lng: interaction.locale }))
        .setStyle(ButtonStyle.Danger)
        .setCustomId("confirm");
      actionRow.addComponents(confirmButton);

      const response = await interaction.reply({
        content: text,
        components: [actionRow],
        flags: [MessageFlags.Ephemeral],
      });

      try {
        const confirmation = await response.awaitMessageComponent({
          filter: i => i.user.id === interaction.user.id,
          time: 60_000,
        })

        if (confirmation.customId === "confirm") {
          confirmation.reply({
            content: i18next.t("command.import.reply.importing_data", { lng: interaction.locale }),
            flags: [MessageFlags.Ephemeral],
          });

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
              confirmation.editReply({
                content: i18next.t("command.import.reply.error_importing_member", {
                  memberId: member.memberId,
                  error,
                  lng: interaction.locale,
                }),
              });
              return;
            }
          }
        }

        confirmation.editReply({
          content: i18next.t("command.import.reply.import_finished", { lng: interaction.locale }),
        })
      } catch {
        interaction.editReply({
          content: i18next.t("command.import.reply.cancelled", { lng: interaction.locale }),
          components: [],
        })
      }
    }
  }

  async execute(interaction: ChatInputCommandInteraction) {
    if (interaction.user.id !== bot.client.application?.owner?.id) {
      interaction.reply({
        content: i18next.t("developer-only", { lng: interaction.locale }),
        flags: [MessageFlags.Ephemeral],
      })
    };

    if (interaction.options.getSubcommand() === "mongodb") {
      this.confirm(interaction);
    }
  }
}
