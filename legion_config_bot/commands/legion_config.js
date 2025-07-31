'use strict';

const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { setLegionAdminRole } = require('../../manager/configDataManager');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('legion_config')
    .setDescription('Legion Botの全体管理者ロールを設定します。')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .setDMPermission(false)
    .addRoleOption(option =>
      option
        .setName('admin_role')
        .setDescription('Legion Botの全体的な管理者権限を持つロール。')
        .setRequired(true)
    ),

  async execute(interaction) {
    // このコマンドはデフォルト権限でサーバー管理者にのみ表示されます
    const adminRole = interaction.options.getRole('admin_role');

    await interaction.deferReply({ ephemeral: true });

    try {
      await setLegionAdminRole(interaction.guildId, adminRole.id);

      await interaction.editReply({
        content: `✅ Legion Botの全体管理者ロールを ${adminRole} に設定しました。`,
      });
    } catch (error) {
      console.error('Error setting Legion admin role:', error);
      await interaction.editReply({
        content: '❌ ロールの設定中にエラーが発生しました。詳細はボットのログを確認してください。',
      });
    }
  },
};