// commands/questBoardSetup.js

const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  MessageFlags,
  ActionRowBuilder,
  ChannelSelectMenuBuilder,
  ChannelType,
} = require('discord.js');
const { handleInteractionError } = require('../../utils/interactionErrorLogger');

const CUSTOM_ID_SELECT_CHANNEL = 'setting_select_dashboard_channels'; // 複数対応のIDに変更
const SETUP_FAIL_MESSAGE = '❌ ダッシュボードの設置に失敗しました。Botに必要な権限（メッセージの送信・編集）があるか確認してください。';

module.exports = {
  data: new SlashCommandBuilder()
    .setName('クエスト掲示板設置')
    .setDescription('クエスト掲示板を複製するチャンネルを複数選択します。(管理者のみ)')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  /**
   * @param {import('discord.js').ChatInputCommandInteraction} interaction
   */
  async execute(interaction) {
    try {
      const row = new ActionRowBuilder().addComponents(
        new ChannelSelectMenuBuilder()
          .setCustomId(CUSTOM_ID_SELECT_CHANNEL) // 複数対応ID
          .setPlaceholder('複製先のチャンネルを選択してください（複数選択可）')
          .addChannelTypes(ChannelType.GuildText)
          .setMinValues(1)
          .setMaxValues(5) // 最大5チャンネルまで選択可能に変更
      );

      await interaction.reply({
        content:
          '📌 クエスト掲示板を複数のチャンネルに複製します。\n複製したいチャンネルをすべて選択してください。',
        components: [row],
        flags: MessageFlags.Ephemeral,
      });
    } catch (error) {
      await handleInteractionError({
        interaction,
        error,
        context: 'クエスト掲示板設置コマンド',
      });
    }
  },
};
