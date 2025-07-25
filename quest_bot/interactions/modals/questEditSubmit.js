// e:/共有フォルダ/legion/quest_bot/interactions/modals/questEditSubmit.js
const { MessageFlags } = require('discord.js');
const questDataManager = require('../../../manager/questDataManager');
const { canEditQuest } = require('../../../manager/permissionManager');
const { updateQuestMessage } = require('../../utils/questMessageManager');
const { updateDashboard } = require('../../utils/dashboardManager');
const { logAction } = require('../../utils/logger');
const { handleInteractionError } = require('../../../utils/interactionErrorLogger');

module.exports = {
    customId: 'quest_edit_submit_', // Prefix match
    async handle(interaction) {
        try {
            await interaction.deferReply({ flags: MessageFlags.Ephemeral });

            const questId = interaction.customId.replace('quest_edit_submit_', '');
            const quest = await questDataManager.getQuest(interaction.guildId, questId);

            if (!quest || !(await canEditQuest(interaction, quest))) {
                return interaction.editReply({ content: '🚫 このクエストを編集する権限がありません。' });
            }

            const title = interaction.fields.getTextInputValue('quest_title');
            const description = interaction.fields.getTextInputValue('quest_description');
            const peopleRaw = interaction.fields.getTextInputValue('quest_people');

            const people = parseInt(peopleRaw, 10);
            if (isNaN(people) || people < 1) {
                return interaction.editReply({ content: '⚠️ 「募集 人数」には1以上の整数を入力してください。' });
            }

            const updates = { name: title, title, description, people, players: people, deadline: null };
            const updatedQuest = await questDataManager.updateQuest(interaction.guildId, questId, updates, interaction.user);

            await logAction({ client: interaction.client, guildId: interaction.guildId, user: interaction.user }, {
                title: '📝 クエスト修正', color: '#f1c40f',
                details: { 'クエスト名': title, '修正者': interaction.user.tag, 'クエストID': questId },
            });

            await updateQuestMessage(interaction.client, updatedQuest);
            await updateDashboard(interaction.client, interaction.guildId);

            await interaction.editReply({ content: `✅ クエスト「${title}」を修正しました。` });
        } catch (error) {
            await handleInteractionError({ interaction, error, context: 'クエスト編集内容保存' });
        }
    }
};