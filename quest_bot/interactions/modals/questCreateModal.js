// e:/共有フォルダ/legion/quest_bot/interactions/modals/questCreateModal.js
const { handleInteractionError } = require('../../../utils/interactionErrorLogger');
const questDataManager = require('../../../manager/questDataManager');
const { createQuestEmbed } = require('../../utils/embeds');
const { createQuestActionButtons } = require('../../components/questActionButtons');
const { updateDashboard } = require('../../utils/dashboardManager');
const { QUEST_CREATE_MODAL, QUEST_TITLE_INPUT, QUEST_DESC_INPUT, QUEST_PLAYERS_INPUT, QUEST_DEADLINE_INPUT } = require('../../utils/customIds');

module.exports = {
    customId: QUEST_CREATE_MODAL,
    async handle(interaction) {
        try {
            await interaction.deferReply({ ephemeral: true });

            // 1. モーダルからデータを取得
            const title = interaction.fields.getTextInputValue(QUEST_TITLE_INPUT);
            const description = interaction.fields.getTextInputValue(QUEST_DESC_INPUT);
            const playersRaw = interaction.fields.getTextInputValue(QUEST_PLAYERS_INPUT);
            const deadlineRaw = interaction.fields.getTextInputValue(QUEST_DEADLINE_INPUT);

            // 2. データを検証
            const players = parseInt(playersRaw, 10);
            if (isNaN(players) || players <= 0) {
                return interaction.editReply({ content: '⚠️ 募集人数には正の整数を入力してください。' });
            }

            let deadlineISO = null;
            if (deadlineRaw) {
                const deadlineDate = new Date(deadlineRaw);
                if (isNaN(deadlineDate.getTime()) || deadlineDate < new Date()) {
                    return interaction.editReply({ content: '⚠️ 募集期限は「YYYY-MM-DD HH:MM」形式の未来の日時で入力してください。' });
                }
                deadlineISO = deadlineDate.toISOString();
            }

            // 3. データストアにクエストを作成
            const newQuest = await questDataManager.createQuest(interaction.guildId, {
                name: title, // Use title for name as well
                title: title,
                description: description,
                players: players,
                deadline: deadlineISO,
            }, interaction.user);

            if (!newQuest) {
                return interaction.editReply({ content: '❌ クエストの作成に失敗しました。もう一度お試しください。' });
            }

            // 4. クエストメッセージを作成して投稿
            const questEmbed = await createQuestEmbed(newQuest);
            const questButtons = await createQuestActionButtons(newQuest, interaction.guildId);

            const questMessage = await interaction.channel.send({
                embeds: [questEmbed],
                components: [questButtons],
            });

            // 5. 作成したクエストにメッセージIDとチャンネルIDを保存
            await questDataManager.updateQuest(interaction.guildId, newQuest.id, {
                messageId: questMessage.id,
                channelId: questMessage.channel.id,
            });

            // 6. ダッシュボードを更新
            await updateDashboard(interaction.client, interaction.guildId);

            // 7. 成功をユーザーに通知
            await interaction.editReply({
                content: `✅ クエスト「${title}」を作成しました！`,
            });

        } catch (error) {
            await handleInteractionError({ interaction, error, context: 'クエスト作成モーダル処理' });
        }
    }
};