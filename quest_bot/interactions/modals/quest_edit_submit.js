const { MessageFlags } = require('discord.js');
const questDataManager = require('../../utils/questDataManager');
const { canEditQuest } = require('../../../permissionManager');
const { updateDashboard } = require('../../utils/dashboardManager');
const { updateQuestMessage } = require('../../utils/questMessageManager');
const { logAction } = require('../../utils/logger');
const { handleInteractionError } = require('../../../interactionErrorLogger');

module.exports = {
    customId: 'quest_edit_submit_', // 'quest_edit_submit_{questId}' に前方一致でマッチ
    async handle(interaction) {
        try {
            await interaction.deferReply({ flags: MessageFlags.Ephemeral });

            // 1. questIdをパースし、クエストデータを取得
            const questId = interaction.customId.replace('quest_edit_submit_', '');
            const quest = await questDataManager.getQuest(interaction.guildId, questId);

            if (!quest) {
                return interaction.editReply({ content: '⚠️ 対象のクエストが見つかりませんでした。' });
            }

            // 2. 権限を再チェック
            // Final permission check: issuer or quest manager/creator
            if (!(await canEditQuest(interaction, quest))) {
                return interaction.editReply({ content: '🚫 このクエストを編集する権限がありません。' });
            }

            // 3. モーダルから値を取得
            const newTitle = interaction.fields.getTextInputValue('quest_title');
            const newDescription = interaction.fields.getTextInputValue('quest_description');
            const newTeamsStr = interaction.fields.getTextInputValue('quest_teams');
            const newPeopleStr = interaction.fields.getTextInputValue('quest_people');
            const newDeadline = interaction.fields.getTextInputValue('quest_deadline').trim();

            // 4. 入力値を検証
            const newTeams = parseInt(newTeamsStr, 10);
            const newPeople = parseInt(newPeopleStr, 10);

            if (isNaN(newTeams) || newTeams < 0 || isNaN(newPeople) || newPeople < 0) {
                return interaction.editReply({ content: '⚠️ 募集組数と募集人数には0以上の半角数字を入力してください。' });
            }

            let deadlineISO = null;
            if (newDeadline) {
                const deadlineDate = new Date(newDeadline);
                if (isNaN(deadlineDate.getTime())) {
                    return interaction.editReply({ content: '⚠️ 募集期限の形式が正しくありません。「YYYY-MM-DD HH:MM」の形式で入力してください。' });
                }
                deadlineISO = deadlineDate.toISOString();
            }

            // 5. 更新用データを作成 (互換性のため複数のプロパティを更新)
            const updates = {
                title: newTitle,
                name: newTitle,
                description: newDescription,
                teams: newTeams,
                people: newPeople,
                players: newPeople,
                deadline: deadlineISO,
            };

            // 6. クエストデータを更新
            const updatedQuest = await questDataManager.updateQuest(interaction.guildId, questId, updates, interaction.user);

            // 7. クエストメッセージと掲示板を更新
            await updateQuestMessage(interaction.client, updatedQuest);
            await updateDashboard(interaction.client, interaction.guildId);

            // 8. アクションをログに記録
            await logAction({ client: interaction.client, guildId: interaction.guildId, user: interaction.user }, {
                title: '📝 クエスト編集',
                color: '#f1c40f', // yellow
                details: { 'クエスト名': updatedQuest.title, 'クエストID': questId },
            });

            // 9. ユーザーに完了を通知
            await interaction.editReply({ content: '✅ クエスト情報を更新し、クエストメッセージと掲示板を更新しました。' });

        } catch (error) {
            await handleInteractionError({ interaction, error, context: 'クエスト編集送信' });
        }
    }
};