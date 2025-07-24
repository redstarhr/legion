// quest_bot/interactions/buttons/questCloseConfirm.js
const questDataManager = require('../../utils/questDataManager');
const { MessageFlags } = require('discord.js');
const { updateQuestMessage } = require('../../utils/questMessageManager');
const { updateDashboard } = require('../../utils/dashboardManager');
const { logAction } = require('../../utils/logger');
const { canEditQuest } = require('../../../permissionManager');

module.exports = {
  customId: 'quest_confirm_close_', // Prefix match
  async handle (interaction) {
    try {
      // 確認メッセージを更新する準備
      await interaction.deferUpdate();

      const questId = interaction.customId.split('_')[3];
      const quest = await questDataManager.getQuest(interaction.guildId, questId);

      if (!quest) {
        return interaction.editReply({ content: '対象のクエストが見つかりませんでした。', components: [] });
      }

      if (quest.isClosed) {
        return interaction.followUp({ content: '⚠️ このクエストは既に締め切られています。', flags: MessageFlags.Ephemeral });
      }

      // Final permission check
      if (!(await canEditQuest(interaction, quest))) {
        return interaction.editReply({ content: 'クエストの〆切は、発注者または管理者のみが行えます。', components: [] });
      }

      // 1. クエストデータを更新
      const updatedQuest = await questDataManager.updateQuest(interaction.guildId, questId, { isClosed: true }, interaction.user);

      // 2. Use the centralized function to update the quest message
      await updateQuestMessage(interaction.client, updatedQuest);
      await updateDashboard(interaction.client, interaction.guildId);

      // 3. アクションをログに記録
      await logAction(interaction, {
        title: '🚫 募集〆切',
        color: '#e74c3c', // red
        details: {
          'クエストタイトル': updatedQuest.title || '無題',
          'クエストID': questId,
        },
      });

      // 4. 確認メッセージを更新して処理完了を通知
      await interaction.editReply({ content: '✅ クエストの募集を締め切りました。', components: [] });
    } catch (error) {
      await handleInteractionError({ interaction, error, context: '募集〆切確認' });
    }
  },
};