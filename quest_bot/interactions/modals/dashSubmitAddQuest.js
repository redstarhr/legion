// e:/共有フォルダ/legion/quest_bot/interactions/modals/dashSubmitAddQuest.js
const { handleInteractionError } = require('../../../utils/interactionErrorLogger');
const questDataManager = require('../../../manager/questDataManager');
const { createQuestEmbed } = require('../../utils/embeds');
const { createQuestActionButtons } = require('../../components/questActionButtons');
const { updateDashboard } = require('../../utils/dashboardManager');
const { DASH_ADD_QUEST_MODAL, DASH_ADD_PRA_INPUT, DASH_ADD_KAMA_INPUT } = require('../../utils/customIds');

async function createSingleQuest(interaction, questName, playerCount) {
    if (playerCount <= 0) return null;

    const newQuest = await questDataManager.createQuest(interaction.guildId, {
        name: questName,
        title: questName,
        description: `${questName}の参加者を募集します。`,
        players: playerCount,
        deadline: null,
    }, interaction.user);

    if (!newQuest) {
        throw new Error(`Failed to create quest: ${questName}`);
    }

    const questEmbed = await createQuestEmbed(newQuest);
    const questButtons = await createQuestActionButtons(newQuest, interaction.guildId);

    const questMessage = await interaction.channel.send({
        embeds: [questEmbed],
        components: [questButtons],
    });

    await questDataManager.updateQuest(interaction.guildId, newQuest.id, {
        messageId: questMessage.id,
        channelId: questMessage.channel.id,
    });

    return newQuest;
}

module.exports = {
    customId: DASH_ADD_QUEST_MODAL,
    async handle(interaction) {
        try {
            await interaction.deferReply({ ephemeral: true });

            // Use the new custom IDs to get the values
            const praCount = parseInt(interaction.fields.getTextInputValue(DASH_ADD_PRA_INPUT), 10);
            const kamaCount = parseInt(interaction.fields.getTextInputValue(DASH_ADD_KAMA_INPUT), 10);

            if (isNaN(praCount) || isNaN(kamaCount) || praCount < 0 || kamaCount < 0) {
                return interaction.editReply({ content: '⚠️ 人数には0以上の整数を入力してください。' });
            }

            if (praCount === 0 && kamaCount === 0) {
                return interaction.editReply({ content: '⚠️ 少なくともどちらか一方の人数を1以上に設定してください。' });
            }

            const createdQuests = [];
            if (praCount > 0) createdQuests.push((await createSingleQuest(interaction, 'プラエトリウム', praCount)).name);
            if (kamaCount > 0) createdQuests.push((await createSingleQuest(interaction, 'カストルム・メリディアヌム', kamaCount)).name);

            await updateDashboard(interaction.client, interaction.guildId);

            await interaction.editReply({
                content: `✅ 以下のクエストを作成しました！\n- ${createdQuests.join('\n- ')}`,
            });

        } catch (error) {
            await handleInteractionError({ interaction, error, context: 'クエスト一括追加処理' });
        }
    }
};