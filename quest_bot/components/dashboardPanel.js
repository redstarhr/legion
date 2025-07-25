// e:/共有フォルダ/legion/quest_bot/components/dashboardPanel.js
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { getAllQuests } = require('../../manager/questDataManager');
const { getEmbedColor } = require('../../manager/configDataManager');

/**
 * Creates the main quest dashboard panel.
 * @param {import('discord.js').Guild} guild The guild to create the panel for.
 * @returns {Promise<import('discord.js').MessageOptions>}
 */
async function createQuestDashboardPanel(guild) {
    const allQuests = await getAllQuests(guild.id);
    const activeQuests = Object.values(allQuests).filter(q => !q.isArchived && !q.isClosed);
    const embedColor = await getEmbedColor(guild.id);

    const embed = new EmbedBuilder()
        .setColor(embedColor)
        .setTitle('☀️ クエスト掲示板')
        .setDescription('今日のクエスト活動を開始します！\n参加できるクエストを探しましょう。')
        .setTimestamp();

    if (activeQuests.length > 0) {
        const questList = activeQuests
            .slice(0, 25) // Embedのフィールド数制限
            .map(quest => `- **${quest.name}** (参加者: ${quest.accepted?.length || 0}/${quest.players})`)
            .join('\n');
        embed.addFields({ name: '募集中クエスト', value: questList });
    } else {
        embed.addFields({ name: '募集中クエスト', value: '現在、募集中のクエストはありません。' });
    }

    const createButton = new ButtonBuilder()
        .setCustomId('quest_create') // クエスト作成ボタンのID
        .setLabel('新しいクエストを作成')
        .setStyle(ButtonStyle.Success)
        .setEmoji('➕');

    const row = new ActionRowBuilder().addComponents(createButton);

    return {
        embeds: [embed],
        components: [row],
    };
}

module.exports = { createQuestDashboardPanel };