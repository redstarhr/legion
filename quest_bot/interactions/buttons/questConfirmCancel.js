// e:/共有フォルダ/legion/quest_bot/interactions/buttons/questConfirmCancel.js
const questDataManager = require('../../../manager/questDataManager');
const { updateQuestMessage } = require('../../utils/questMessageManager');
const { updateDashboard } = require('../../utils/dashboardManager');
const { logAction } = require('../../utils/logger');
const { sendCancellationNotification } = require('../../utils/notificationManager');
const { handleInteractionError } = require('../../../utils/interactionErrorLogger');
const { QUEST_CONFIRM_CANCEL } = require('../../utils/customIds');

module.exports = {
    customId: QUEST_CONFIRM_CANCEL, // Prefix match
    async handle(interaction) {
        try {
            await interaction.deferUpdate();

            const questId = interaction.customId.replace(QUEST_CONFIRM_CANCEL, '');
            const quest = await questDataManager.getQuest(interaction.guildId, questId);

            if (!quest) {
                return interaction.editReply({ content: '⚠️ 対象のクエストが見つかりませんでした。', components: [] });
            }

            const wasFull = quest.isClosed; // Check if it was full before cancellation
            const originalAcceptanceCount = quest.accepted?.length || 0;
            const updatedAccepted = quest.accepted?.filter(a => a.userId !== interaction.user.id) || [];

            if (originalAcceptanceCount === updatedAccepted.length) {
                 return interaction.editReply({ content: '⚠️ あなたはこのクエストを受注していません。', components: [] });
            }

            const updates = { accepted: updatedAccepted, isClosed: false }; // Always reopen when someone cancels
            const updatedQuest = await questDataManager.updateQuest(interaction.guildId, questId, updates, interaction.user);

            await updateQuestMessage(interaction.client, updatedQuest);
            await updateDashboard(interaction.client, interaction.guildId);

            await logAction({ client: interaction.client, guildId: interaction.guildId, user: interaction.user }, {
                title: '↪️ クエスト受注取消', color: '#e67e22',
                details: { 'クエスト名': updatedQuest.title, 'クエストID': questId },
            });

            await sendCancellationNotification({ interaction, quest: updatedQuest, wasFull });
            await interaction.editReply({ content: '✅ クエストの受注を取り消しました。', components: [] });
        } catch (error) {
            await handleInteractionError({ interaction, error, context: 'クエスト受注取消処理' });
        }
    }
};