// quest_bot/interactions/buttons/questReopen.js
const { MessageFlags } = require('discord.js');
const questDataManager = require('../../utils/questDataManager');
const { updateQuestMessage } = require('../../utils/questMessageManager');
const { updateDashboard } = require('../../utils/dashboardManager');
const { logAction } = require('../../utils/logger');
const { canEditQuest } = require('../../../permissionManager');
const { handleInteractionError } = require('../../../utils/interactionErrorLogger');

module.exports = {
  customId: 'quest_toggle_reopen_', // Prefix match
  async handle (interaction) {
    try {
      await interaction.deferUpdate();

      const questId = interaction.customId.split('_')[3];
      const quest = await questDataManager.getQuest(interaction.guildId, questId);

      if (!quest) {
        return interaction.followUp({ content: '対象のクエストが見つかりませんでした。', flags: MessageFlags.Ephemeral });
      }

      // Check if the quest is already open
      if (!quest.isClosed) {
        return interaction.followUp({ content: '⚠️ このクエストは既に募集中です。', flags: MessageFlags.Ephemeral });
      }

      // Permission check: issuer or manager
      if (!(await canEditQuest(interaction, quest))) {
        return interaction.followUp({ content: 'クエストの募集再開は、発注者または管理者のみが行えます。', flags: MessageFlags.Ephemeral });
      }

      // 1. クエストデータを更新して募集を再開
      const updatedQuest = await questDataManager.updateQuest(interaction.guildId, questId, { isClosed: false }, interaction.user);

      // 2. 更新後のクエストを取得し、全てのメッセージを更新
      await updateQuestMessage(interaction.client, updatedQuest);
      await updateDashboard(interaction.client, interaction.guildId);

      // 3. アクションをログに記録
      await logAction(interaction, {
        title: '🟢 募集再開',
        color: '#2ecc71', // green
        details: {
          'クエストタイトル': updatedQuest.title || '無題',
          'クエストID': questId,
        },
      });

      // 4. 実行者に完了を通知
      await interaction.followUp({ content: '✅ クエストの募集を再開しました。', flags: MessageFlags.Ephemeral });
    } catch (error) {
      await handleInteractionError({ interaction, error, context: '募集再開処理' });
    }
  },
};