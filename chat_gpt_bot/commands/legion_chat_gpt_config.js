'use strict';

const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const { isAdmin } = require('../../manager/permissionManager');
const { setChatGptAdminRole } = require('../../manager/configDataManager');
const { getChatGPTConfig, setChatGPTConfig } = require('../utils/configManager');

module.exports = {
  // コマンドの定義
  data: new SlashCommandBuilder()
    .setName('chatgpt_設定')
    .setDescription('ChatGPT関連の各種設定を行います。')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator) // このコマンドは管理者のみが見えるように
    .setDMPermission(false) // DMでは使用不可
    .addSubcommand(subcommand =>
      subcommand
        .setName('admin_role')
        .setDescription('ChatGPT機能の管理者ロールを設定します。')
        .addRoleOption(option =>
          option
            .setName('role')
            .setDescription('ChatGPT関連コマンドを管理できるロール。')
            .setRequired(true),
        ),
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('応答チャンネル_追加')
        .setDescription('ChatGPTが自動応答するチャンネルを追加します。')
        .addChannelOption(option =>
          option
            .setName('channel')
            .setDescription('追加するチャンネル')
            .addChannelTypes(ChannelType.GuildText)
            .setRequired(true),
        ),
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('応答チャンネル_削除')
        .setDescription('ChatGPTが自動応答するチャンネルを削除します。')
        .addChannelOption(option =>
          option
            .setName('channel')
            .setDescription('削除するチャンネル')
            .addChannelTypes(ChannelType.GuildText)
            .setRequired(true),
        ),
    )
    .addSubcommand(subcommand =>
      subcommand.setName('応答チャンネル_一覧').setDescription('ChatGPTが自動応答するチャンネルの一覧を表示します。'),
    ),

  // コマンド実行時の処理
  async execute(interaction) {
    // サーバー管理者でなければ弾く
    if (!isAdmin(interaction)) {
      return interaction.reply({
        content: 'このコマンドを実行するには、サーバーの管理者権限が必要です。',
        ephemeral: true,
      });
    }

    await interaction.deferReply({ ephemeral: true });

    const subcommand = interaction.options.getSubcommand();

    try {
      if (subcommand === 'admin_role') {
        const role = interaction.options.getRole('role');
        await setChatGptAdminRole(interaction.guildId, role.id);
        await interaction.editReply({
          content: `✅ ChatGPTの管理者ロールを ${role} に設定しました。`,
        });
      } else if (subcommand === '応答チャンネル_追加') {
        const channel = interaction.options.getChannel('channel');
        const config = await getChatGPTConfig(interaction.guildId);
        const allowedChannels = config.allowedChannels || [];

        if (allowedChannels.includes(channel.id)) {
          return interaction.editReply({ content: `ℹ️ ${channel} は既に応答チャンネルとして登録されています。` });
        }

        const newAllowedChannels = [...allowedChannels, channel.id];
        await setChatGPTConfig(interaction.guildId, { allowedChannels: newAllowedChannels });

        await interaction.editReply({ content: `✅ ${channel} を自動応答チャンネルに追加しました。` });
      } else if (subcommand === '応答チャンネル_削除') {
        const channel = interaction.options.getChannel('channel');
        const config = await getChatGPTConfig(interaction.guildId);
        const allowedChannels = config.allowedChannels || [];

        if (!allowedChannels.includes(channel.id)) {
          return interaction.editReply({ content: `ℹ️ ${channel} は応答チャンネルとして登録されていません。` });
        }

        const newAllowedChannels = allowedChannels.filter(id => id !== channel.id);
        await setChatGPTConfig(interaction.guildId, { allowedChannels: newAllowedChannels });

        await interaction.editReply({ content: `✅ ${channel} を自動応答チャンネルから削除しました。` });
      } else if (subcommand === '応答チャンネル_一覧') {
        const config = await getChatGPTConfig(interaction.guildId);
        const allowedChannels = config.allowedChannels || [];

        if (allowedChannels.length === 0) {
          return interaction.editReply({ content: '現在、自動応答チャンネルは設定されていません。' });
        }

        const channelList = allowedChannels.map(id => `<#${id}>`).join('\n');
        await interaction.editReply({ content: `**現在の自動応答チャンネル:**\n${channelList}` });
      }
    } catch (error) {
      console.error('Error in chatgpt_設定 command:', error);
      await interaction.editReply({
        content: '❌ ロールの設定中にエラーが発生しました。詳細はボットのログを確認してください。',
      });
    }
  },
};