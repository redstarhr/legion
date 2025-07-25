// e:/共有フォルダ/legion/quest_bot/interactions/buttons/questOpenCancelConfirm.js
const { replyWithConfirmation } = require('../../components/confirmationUI');
const questDataManager = require('../../../manager/questDataManager');
const { handleInteractionError } = require('../../../utils/interactionErrorLogger');
const { QUEST_OPEN_CANCEL_CONFIRM, QUEST_CONFIRM_CANCEL, QUEST_ABORT_CANCEL } = require('../../utils/customIds');

module.exports = {
    customId: QUEST_OPEN_CANCEL_CONFIRM, // Prefix match
    async handle(interaction) {
        try {
            const questId = interaction.customId.replace(QUEST_OPEN_CANCEL_CONFIRM, '');
            const quest = await questDataManager.getQuest(interaction.guildId, questId);

            if (!quest) {
                return interaction.reply({ content: '⚠️ 対象のクエストが見つかりませんでした。', ephemeral: true });
            }

            const acceptance = quest.accepted?.find(a => a.userId === interaction.user.id && a.status !== 'failed');
            if (!acceptance) {
                return interaction.reply({ content: '⚠️ あなたはこのクエストを受注していません。', ephemeral: true });
            }

            await replyWithConfirmation(interaction, {
                content: '本当にこのクエストの受注を取り消しますか？',
                confirmCustomId: `${QUEST_CONFIRM_CANCEL}${questId}`,
                confirmLabel: 'はい、取り消します',
                cancelCustomId: QUEST_ABORT_CANCEL,
            });
        } catch (error) {
            await handleInteractionError({ interaction, error, context: 'クエスト受注取消確認' });
        }
    }
};