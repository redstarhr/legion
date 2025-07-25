// e:/共有フォルダ/legion/quest_bot/utils/paginationUtils.js
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder } = require('discord.js');
const questDataManager = require('../../manager/questDataManager');
const QUESTS_PER_PAGE = 5;

/**
 * Generates an embed and components for viewing a paginated list of completed quests.
 * @param {import('discord.js').Interaction} interaction The interaction object.
 * @param {number} page The page number to display.
 * @returns {Promise<object>} A message payload object with embeds and components.
 */
async function generateCompletedQuestsView(interaction, page = 1) {
    const allQuests = await questDataManager.getAllQuests(interaction.guildId);
    const completedQuests = Object.values(allQuests)
        .filter(q => q.isArchived)
        .sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt));

    if (completedQuests.length === 0) {
        return { content: '終了済みのクエストはありません。', embeds: [], components: [] };
    }

    const totalPages = Math.ceil(completedQuests.length / QUESTS_PER_PAGE);
    page = Math.max(1, Math.min(page, totalPages)); // Ensure page is within bounds

    const startIndex = (page - 1) * QUESTS_PER_PAGE;
    const questsOnPage = completedQuests.slice(startIndex, startIndex + QUESTS_PER_PAGE);

    const embed = new EmbedBuilder()
        .setTitle('✅ 終了済みクエスト一覧')
        .setColor(0x95a5a6)
        .setFooter({ text: `ページ ${page} / ${totalPages}` });

    if (questsOnPage.length > 0) {
        embed.setDescription(questsOnPage.map(quest => `📜 **${quest.name || '無題'}** (ID: \`${quest.id}\`)\n> 終了日: ${new Date(quest.completedAt).toLocaleString('ja-JP')}`).join('\n\n'));
    } else {
        embed.setDescription('このページに表示するクエストはありません。');
    }

    const buttons = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId(`list_completed_prevPage_${interaction.user.id}`).setLabel('◀️ 前へ').setStyle(ButtonStyle.Secondary).setDisabled(page <= 1),
        new ButtonBuilder().setCustomId(`list_completed_nextPage_${interaction.user.id}`).setLabel('次へ ▶️').setStyle(ButtonStyle.Secondary).setDisabled(page >= totalPages)
    );

    const components = [buttons];
    if (questsOnPage.length > 0) {
        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId(`list_select_unarchive_${interaction.user.id}`)
            .setPlaceholder('クエストをアクティブな状態に戻す...')
            .addOptions(questsOnPage.map(quest => ({ label: quest.name || '無題のクエスト', description: `ID: ${quest.id}`, value: quest.id })));
        components.push(new ActionRowBuilder().addComponents(selectMenu));
    }

    return { embeds: [embed], components };
}

module.exports = { generateCompletedQuestsView };