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
        .addStringOption(option => option.setName('カラーコード').setDescription('16進数カラーコード (例: #00bfff)').setRequired(true)))
    .addSubcommand(subcommand =>
      subcommand
        .setName('ボタン順設定')
        .setDescription('クエスト掲示板の主要ボタンの並び順を設定します。')
        .addStringOption(option =>
          option.setName('順序')
            .setDescription('ボタンの表示順を選択してください。左から順に表示されます。')
            .setRequired(true)
            .addChoices(
              { name: '受注 > 取消 > 編集 > 連絡 (デフォルト)', value: 'accept,cancel,edit,dm' },
              { name: '受注 > 編集 > 連絡 > 取消', value: 'accept,edit,dm,cancel' },
              { name: '編集 > 受注 > 連絡 > 取消', value: 'edit,accept,dm,cancel' },
              { name: '連絡 > 編集 > 受注 > 取消', value: 'dm,edit,accept,cancel' }
            ))),

  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand();
    const guildId = interaction.guildId;

    await interaction.deferReply({ ephemeral: true });

    if (subcommand === 'ロール設定') {
      const role = interaction.options.getRole('ロール');
      await questDataManager.setQuestManagerRole(guildId, role?.id || null);
      const replyMessage = role ? `✅ クエスト管理者ロールを **${role.name}** に設定しました。` : '✅ クエスト管理者ロールの設定を解除しました。';
      await interaction.followUp({ content: replyMessage });
      await logAction(interaction, {
        title: '⚙️ 管理者ロール設定',
        description: replyMessage,
        color: '#95a5a6',
        details: {
          '設定ロール': role ? `${role.name} (${role.id})` : '解除',
        },
      });

    } else if (subcommand === 'ログ設定') {
      const channel = interaction.options.getChannel('チャンネル');
      await questDataManager.setLogChannel(guildId, channel?.id || null);
      const replyMessage = channel ? `✅ ログ出力チャンネルを <#${channel.id}> に設定しました。` : '✅ ログ出力チャンネルの設定を解除しました。';
      await interaction.followUp({ content: replyMessage });
      await logAction(interaction, {
        title: '⚙️ ログチャンネル設定',
        description: replyMessage,
        color: '#95a5a6',
        details: {
          '設定チャンネル': channel ? `<#${channel.id}>` : '解除',
        },
      });

    } else if (subcommand === '通知設定') {
      const channel = interaction.options.getChannel('チャンネル');
      await questDataManager.setNotificationChannel(guildId, channel?.id || null);
      const replyMessage = channel ? `✅ クエスト通知チャンネルを <#${channel.id}> に設定しました。` : '✅ クエスト通知チャンネルの設定を解除しました。';
      await interaction.followUp({ content: replyMessage });
      await logAction(interaction, {
        title: '⚙️ 通知チャンネル設定',
        description: replyMessage,
        color: '#95a5a6',
        details: {
          '設定チャンネル': channel ? `<#${channel.id}>` : '解除',
        },
      });

    } else if (subcommand === '色設定') {
      const color = interaction.options.getString('カラーコード');
      const hexColorRegex = /^#[0-9a-fA-F]{6}$/;
      if (!hexColorRegex.test(color)) {
        return interaction.followUp({ content: '⚠️ 無効なカラーコードです。`#`から始まる6桁の16進数コードを入力してください。(例: `#00bfff`)' });
      }
      await questDataManager.setEmbedColor(guildId, color);
      const replyMessage = `✅ Embedの色を **${color}** に設定しました。`;
      await interaction.followUp({ content: replyMessage });
      await logAction(interaction, {
        title: '⚙️ Embedカラー設定',
        description: replyMessage,
        color: '#95a5a6',
        details: {
          '設定カラー': color,
        },
      });
    } else if (subcommand === 'ボタン順設定') {
      const orderString = interaction.options.getString('順序');
      const orderArray = orderString.split(',');

      await questDataManager.setButtonOrder(guildId, orderArray);

      const buttonNameMap = {
        accept: '受注',
        cancel: '受注取消',
        edit: '編集',
        dm: '参加者に連絡'
      };
      const friendlyOrder = orderArray.map(key => `\`${buttonNameMap[key]}\``).join(' > ');

      const replyMessage = `✅ ボタンの表示順を **${friendlyOrder}** に設定しました。`;
      await interaction.followUp({ content: replyMessage });
      await logAction(interaction, {
        title: '⚙️ ボタン順設定',
        description: replyMessage,
        color: '#95a5a6',
        details: {
          '設定順': `[${orderString}]`,
        },
      });
    }
  },
};