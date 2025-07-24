// commands/legion_chat_gpt_usage.js

const { SlashCommandBuilder, PermissionFlagsBits, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');
const { isChatGptAdmin } = require('../../permissionManager');
const {
  createAdminEmbed,
} = require('../utils/embedHelper');
const { handleInteractionError } = require('../../utils/interactionErrorLogger');


module.exports = {
  data: new SlashCommandBuilder()
    .setName('legion_chatgpt_使用率')
    .setDescription('今月のOpenAI API使用量を表示します')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    try {
      await interaction.deferReply({ ephemeral: true });

      // 管理者権限チェック
      const isAdmin = await isChatGptAdmin(interaction);
      if (!isAdmin) {
        const noPermissionEmbed = createAdminEmbed(
          '❌ 権限がありません',
          'この操作は管理者のみ実行可能です。'
        );
        return await interaction.editReply({ embeds: [noPermissionEmbed], components: [] });
      }

      const row = new ActionRowBuilder()
        .addComponents(
          new StringSelectMenuBuilder()
            .setCustomId('chatgpt_select_usage_type')
            .setPlaceholder('確認したい機能のタイプを選択してください')
            .addOptions([
              {
                label: '「今日のChatGPT」機能',
                description: '「今日の情報」ボタンや関連コマンドの使用量を確認します。',
                value: 'usage_today_gpt',
              },
              {
                label: '自動応答機能',
                description: '設定チャンネルでの自動応答の使用量を確認します。',
                value: 'usage_auto_response',
              },
            ])
        );

      await interaction.editReply({
        content: 'どの機能に関連する使用量を確認しますか？\n**（注意: 表示される値はAPIキーに紐づく合計使用量です）**',
        components: [row],
      });
    } catch (error) {
      await handleInteractionError({ interaction, error, context: 'ChatGPT使用量表示' });
    }
  },
};
