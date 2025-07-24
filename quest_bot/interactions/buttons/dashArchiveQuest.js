// quest_bot/interactions/selectMenus/dashAcceptQuestSelect.js
const { ActionRowBuilder, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
const questDataManager = require('../../utils/questDataManager');
const { calculateRemainingSlots } = require('../../utils/questUtils');
const { handleInteractionError } = require('../../../utils/interactionErrorLogger');

module.exports = {
    customId: 'dash_select_acceptQuest_', // Prefix match
    async handle (interaction) {
        try {
            const questId = interaction.values[0];
            const quest = await questDataManager.getQuest(interaction.guildId, questId);

            if (!quest) {
                return interaction.update({ content: '⚠️ 選択されたクエストが見つかりませんでした。ダッシュボードが更新されるまでお待ちください。', components: [] });
            }

            // ユーザーが既にこのクエストを受注しているか確認
            const { remainingTeams, remainingPeople, activeAccepted } = calculateRemainingSlots(quest);
            const hasAccepted = activeAccepted.some(a => a.userId === interaction.user.id);
            if (hasAccepted) {
                return interaction.update({ content: `⚠️ あなたは既にクエスト「${quest.name}」を受注済みです。変更する場合は、一度討伐/失敗報告をしてから再度受注してください。`, components: [] });
            }

            // 1組も受注できない場合は定員とみなす
            if (remainingTeams < 1 || remainingPeople <= 0) {
                 return interaction.update({ content: '⚠️ このクエストは既に定員に達しています。', components: [] });
            }

            // モーダルを作成して表示する
            const modal = new ModalBuilder()
                .setCustomId(`quest_submit_acceptModal_${questId}`) // 既存のモーダル送信ハンドラを再利用
                .setTitle(`クエスト受注: ${quest.name}`);

            const peopleInput = new TextInputBuilder()
                .setCustomId('accept_people')
                .setLabel(`受注する人数 (残り: ${remainingPeople}人)`)
                .setStyle(TextInputStyle.Short)
                .setPlaceholder(`例: 4 (最大 ${remainingPeople} 人まで)`)
                .setRequired(true);

            const commentInput = new TextInputBuilder()
                .setCustomId('accept_comment')
                .setLabel('備考（任意）')
                .setStyle(TextInputStyle.Paragraph)
                .setPlaceholder('なんでもどうぞ')
                .setRequired(false);

            modal.addComponents(
                new ActionRowBuilder().addComponents(peopleInput),
                new ActionRowBuilder().addComponents(commentInput)
            );

            await interaction.showModal(modal);
        } catch (error) {
            await handleInteractionError({ interaction, error, context: 'クエスト受注UI表示' });
        }
    },
};