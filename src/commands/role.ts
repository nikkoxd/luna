import { ChatInputCommandInteraction, MessageFlags, PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import { Command } from "../base/Command";
import { bot } from "..";
import { roles } from "../schema";
import i18next from "i18next";
import { and, eq } from "drizzle-orm";

export default class RoleCommand extends Command {
  constructor() {
    super(new SlashCommandBuilder()
      .setName("role")
      .setDescription("Commands related to roles")
      .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
      .addSubcommand(subcommand => subcommand
        .setName("add")
        .setDescription("Add a role to rewards list")
        .addRoleOption(option => option
          .setName("role")
          .setDescription("The role to add")
          .setRequired(true)
        )
        .addNumberOption(option => option
          .setName("level")
          .setDescription("The level required to get the role")
          .setRequired(true)
        )
      )
      .addSubcommand(subcommand => subcommand
        .setName("remove")
        .setDescription("Remove a role from rewards list")
        .addRoleOption(option => option
          .setName("role")
          .setDescription("The role to remove")
          .setRequired(true)
        )
      )
    )
  }

  async add(interaction: ChatInputCommandInteraction) {
    const role = interaction.options.getRole("role", true);
    const level = interaction.options.getNumber("level", true);

    const result = await bot.drizzle.insert(roles).values({
      id: Number(role.id),
      guildId: Number(interaction.guildId),
      level: level,
    }).onConflictDoNothing().returning();

    if (result.length === 0) {
      interaction.reply({
        content: i18next.t("command.role.reply.add_error", { lng: interaction.locale }),
        flags: [MessageFlags.Ephemeral],
      });
      return;
    }

    interaction.reply({
      content: i18next.t("command.role.reply.added", { lng: interaction.locale }),
      flags: [MessageFlags.Ephemeral],
    });
  }

  async remove(interaction: ChatInputCommandInteraction) {
    const role = interaction.options.getRole("role", true);

    const result = await bot.drizzle.delete(roles).where(and(
      eq(roles.id, Number(role.id)),
      eq(roles.guildId, Number(interaction.guildId))
    )).returning();

    if (result.length === 0) {
      interaction.reply({
        content: i18next.t("command.role.reply.removal_error", { lng: interaction.locale }),
        flags: [MessageFlags.Ephemeral],
      });
      return;
    }

    interaction.reply({
      content: i18next.t("command.role.reply.removed", { lng: interaction.locale }),
      flags: [MessageFlags.Ephemeral],
    });
  }

  async execute(interaction: ChatInputCommandInteraction) {
    const subcommand = interaction.options.getSubcommand();
    switch (subcommand) {
      case "add":
        this.add(interaction);
        return;
      case "remove":
        this.remove(interaction);
        return;
    }
  }
}
