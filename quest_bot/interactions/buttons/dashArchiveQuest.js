// quest_bot/interactions/selectMenus/dashAcceptQuestSelect.js
const { ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');
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

            // 募集中の人数（最大25人）の選択肢を生成
            const peopleOptionsCount = Math.min(remainingPeople, 25);
            const peopleOptions = Array.from({ length: peopleOptionsCount }, (_, i) => ({
                label: `${i + 1}人`,
                value: `${i + 1}`,
            }));

            const selectMenu = new StringSelectMenuBuilder()
                // 次のハンドラに team=1 を渡す
                .setCustomId(`dash_select_acceptPlayers_${questId}_1_${interaction.id}`)
                .setPlaceholder('受注する人数を選択してください')
                .addOptions(peopleOptions);

            const row = new ActionRowBuilder().addComponents(selectMenu);

            await interaction.update({
                content: `**クエスト「${quest.name}」を受注します。**\n受注する人数を選択してください。`,
                components: [row],
            });
        } catch (error) {
            await handleInteractionError({ interaction, error, context: 'クエスト受注UI表示' });
        }
    },
};