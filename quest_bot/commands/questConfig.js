// commands/questConfig.js

const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const questDataManager = require('../utils/questDataManager');
const { logAction } = require('../utils/logger');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('config')
    .setDescription('Botの各種設定を行います。(管理者のみ)')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand(subcommand =>
      subcommand
        .setName('ロール設定')
        .setDescription('クエストを管理できるロールを設定/解除します。')
        .addRoleOption(option => option.setName('ロール').setDescription('権限を付与するロール (未指定で解除)')))
    .addSubcommand(subcommand =>
      subcommand
        .setName('ログ設定')
        .setDescription('操作ログを出力するチャンネルを設定/解除します。')
        .addChannelOption(option => option.setName('チャンネル').setDescription('ログ出力チャンネル (未指定で解除)').addChannelTypes(ChannelType.GuildText)))
    .addSubcommand(subcommand =>
      subcommand
        .setName('通知設定')
        .setDescription('クエストの受注/取消通知を送るチャンネルを設定/解除します。')
        .addChannelOption(option => option.setName('チャンネル').setDescription('クエスト通知チャンネル (未指定で解除)').addChannelTypes(ChannelType.GuildText)))
    .addSubcommand(subcommand =>
      subcommand
        .setName('色設定')
        .setDescription('クエスト掲示板のEmbedの色を設定します。')
        .addStringOption(option => option.setName('カラーコード').setDescription('16進数カラーコード (例: #00bfff)').setRequired(true))),

  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand();
    const guildId = interaction.guildId;

    await interaction.deferReply({ ephemeral: true });

    if (subcommand === 'ロール設定') {
      const role = interaction.options.getRole('ロール');
      questDataManager.setQuestManagerRole(guildId, role?.id || null);
      const replyMessage = role ? `✅ クエスト管理者ロールを **${role.name}** に設定しました。` : '✅ クエスト管理者ロールの設定を解除しました。';
      await interaction.followUp({ content: replyMessage });
      logAction(interaction, '管理者ロール設定', replyMessage);

    } else if (subcommand === 'ログ設定') {
      const channel = interaction.options.getChannel('チャンネル');
      questDataManager.setLogChannel(guildId, channel?.id || null);
      const replyMessage = channel ? `✅ ログ出力チャンネルを <#${channel.id}> に設定しました。` : '✅ ログ出力チャンネルの設定を解除しました。';
      await interaction.followUp({ content: replyMessage });
      logAction(interaction, 'ログチャンネル設定', replyMessage);

    } else if (subcommand === '通知設定') {
      const channel = interaction.options.getChannel('チャンネル');
      questDataManager.setNotificationChannel(guildId, channel?.id || null);
      const replyMessage = channel ? `✅ クエスト通知チャンネルを <#${channel.id}> に設定しました。` : '✅ クエスト通知チャンネルの設定を解除しました。';
      await interaction.followUp({ content: replyMessage });
      logAction(interaction, '通知チャンネル設定', replyMessage);

    } else if (subcommand === '色設定') {
      const color = interaction.options.getString('カラーコード');
      const hexColorRegex = /^#[0-9a-fA-F]{6}$/;
      if (!hexColorRegex.test(color)) {
        return interaction.followUp({ content: '⚠️ 無効なカラーコードです。`#`から始まる6桁の16進数コードを入力してください。(例: `#00bfff`)' });
      }
      questDataManager.setEmbedColor(guildId, color);
      const replyMessage = `✅ Embedの色を **${color}** に設定しました。`;
      await interaction.followUp({ content: replyMessage });
      logAction(interaction, 'Embedカラー設定', replyMessage);
    }
  },
};