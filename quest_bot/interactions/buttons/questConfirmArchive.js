// quest_bot/interactions/buttons/questArchive.js
const questDataManager = require('../../../manager/questDataManager');
const { MessageFlags } = require('discord.js');
const { updateQuestMessage } = require('../../utils/questMessageManager');
const { updateDashboard } = require('../../utils/dashboardManager');
const { logAction } = require('../../utils/logger');
const { canEditQuest } = require('../../../manager/permissionManager');
const { handleInteractionError } = require('../../../utils/interactionErrorLogger');
const { QUEST_CONFIRM_ARCHIVE } = require('../../utils/customIds');

module.exports = {
  customId: QUEST_CONFIRM_ARCHIVE,
  async handle (interaction) {
    try {
      await interaction.deferUpdate();

      const questId = interaction.customId.replace(QUEST_CONFIRM_ARCHIVE, '');
      const quest = await questDataManager.getQuest(interaction.guildId, questId);

      if (!quest) {
        return interaction.followUp({ content: '対象のクエストが見つかりませんでした。', flags: MessageFlags.Ephemeral });
      }

      if (quest.isArchived) {
        return interaction.followUp({ content: '⚠️ このクエストは既に完了（アーカイブ）済みです。', flags: MessageFlags.Ephemeral });
      }

      // Final permission check: issuer or quest manager/creator
      if (!(await canEditQuest(interaction, quest))) {
        return interaction.followUp({ content: 'クエストの完了は、発注者または管理者のみが行えます。', flags: MessageFlags.Ephemeral });
      }

      const updatedQuest = await questDataManager.updateQuest(interaction.guildId, questId, {
        isArchived: true,
        isClosed: true,
        completedAt: new Date().toISOString(), // Used for sorting in listCompletedQuests
      }, interaction.user);

      await updateQuestMessage(interaction.client, updatedQuest);

      // 3. Update the dashboard
      await updateDashboard(interaction.client, interaction.guildId);

      // 4. Log the action
      await logAction({ client: interaction.client, guildId: interaction.guildId, user: interaction.user }, {
        title: '✅ クエスト完了',
        color: '#95a5a6', // grey
        details: {
          'クエストタイトル': updatedQuest.title || '無題',
          'クエストID': questId,
        },
      });

      // 5. Update the confirmation message
      await interaction.editReply({ content: '✅ クエストを完了状態にしました。', components: [] });
    } catch (error) {
      await handleInteractionError({ interaction, error, context: 'クエスト完了確認' });
    }
  },
};