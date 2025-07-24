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

const CUSTOM_ID_SELECT_CHANNEL = 'setting_select_dashboard_channel';
const SETUP_FAIL_MESSAGE = '❌ ダッシュボードの設置に失敗しました。Botに必要な権限（メッセージの送信・編集）があるか確認してください。';

module.exports = {
  data: new SlashCommandBuilder()
    .setName('クエスト掲示板設置')
    .setDescription('クエスト掲示板を設置するチャンネルを選択します。(管理者のみ)')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  /**
   * @param {import('discord.js').ChatInputCommandInteraction} interaction
   */
  async execute(interaction) {
    try {
      const row = new ActionRowBuilder().addComponents(
        new ChannelSelectMenuBuilder()
          .setCustomId(CUSTOM_ID_SELECT_CHANNEL) // 既存の設定ハンドラと一致させる
          .setPlaceholder('掲示板を設置/移動するチャンネルを選択')
          .addChannelTypes(ChannelType.GuildText)
          .setMinValues(1)
          .setMaxValues(1)
      );

      await interaction.reply({
        content: '📌 クエスト掲示板を設置するチャンネルを選択してください。\nすでに掲示板がある場合、新しい場所に移動します。',
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
