// quest_bot/utils/dashboardManager.js
const { EmbedBuilder } = require('discord.js');
const questDataManager = require('./questDataManager');
const { createDashboardActionRows } = require('../components/dashboardActionButtons');

/**
 * Generates the embeds for the quest dashboard.
 * @param {object[]} quests - An array of all quest objects.
 * @returns {EmbedBuilder[]}
 */
function createDashboardEmbeds(quests) {
    // --- クエスト一覧 Embed ---
    const questListEmbed = new EmbedBuilder()
        .setColor(0x00bfff)
        .setTitle('📜 クエスト一覧');

    const activeQuests = quests.filter(q => !q.isArchived);

    if (activeQuests.length > 0) {
        const questFields = activeQuests.map(q => {
            // この計算は変更しない。失敗者も枠を占有し続けるため。
            const acceptedPlayers = q.accepted.reduce((sum, p) => sum + p.players, 0);
            return {
                name: q.name || '無題のクエスト',
                value: `> 募集: ${q.players}人 / ${q.teams}組\n> 現在: ${acceptedPlayers}人`,
                inline: true,
            };
        });
        questListEmbed.addFields(questFields);
    } else {
        questListEmbed.setDescription('現在、アクティブなクエストはありません。');
    }

    // --- 受注一覧 Embed ---
    const acceptedListEmbed = new EmbedBuilder()
        .setColor(0x2ecc71)
        .setTitle('👥 受注状況一覧');

    const allAccepted = activeQuests.flatMap(q =>
        q.accepted.map(a => ({ ...a, questName: q.name || '無題のクエスト' }))
    );

    // 失敗ステータスのない受注のみをフィルタリング
    const visibleAccepted = allAccepted.filter(a => a.status !== 'failed');

    if (visibleAccepted.length > 0) {
        const acceptedText = visibleAccepted.map(a =>
            `> **${a.questName}**: ${a.userTag} さんが ${a.teams}組 / ${a.players}人 受注`
        ).join('\n');
        acceptedListEmbed.setDescription(acceptedText);
    } else {
        acceptedListEmbed.setDescription('現在、クエストを受注している人はいません。');
    }

    return [questListEmbed, acceptedListEmbed];
}

/**
 * Fetches all data and updates the quest dashboard message.
 * @param {import('discord.js').Client} client
 * @param {string} guildId
 */
async function updateDashboard(client, guildId) {
    const dashboard = await questDataManager.getDashboard(guildId);
    if (!dashboard) {
        console.warn(`[Dashboard] Guild ${guildId} にダッシュボードが設定されていません。`);
        return;
    }

    try {
        const channel = await client.channels.fetch(dashboard.channelId);
        const message = await channel.messages.fetch(dashboard.messageId);

        const allQuests = Object.values(await questDataManager.getAllQuests(guildId));
        const embeds = createDashboardEmbeds(allQuests);
        const components = createDashboardActionRows();

        await message.edit({
            content: ' ', // contentを空にしないとEmbedが更新されないことがある
            embeds: embeds,
            components: components,
        });
    } catch (error) {
        console.error(`[Dashboard] ダッシュボードの更新に失敗しました (Guild: ${guildId}):`, error);
    }
}

module.exports = { updateDashboard };