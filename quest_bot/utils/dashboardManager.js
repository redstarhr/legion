// e:/共有フォルダ/legion/quest_bot/utils/dashboardManager.js
const { EmbedBuilder, RESTJSONErrorCodes } = require('discord.js');
const questDataManager = require('../../manager/questDataManager');
const configDataManager = require('../../manager/configDataManager');

/**
 * Updates the quest dashboard message with the current list of active quests.
 * @param {import('discord.js').Client} client The Discord client instance.
 * @param {string} guildId The ID of the guild to update the dashboard for.
 */
async function updateDashboard(client, guildId) {
    try {
        const dashboardConfig = await configDataManager.getDashboard(guildId);
        if (!dashboardConfig || !dashboardConfig.channelId || !dashboardConfig.messageId) {
            // No dashboard is configured, so we can just exit.
            return;
        }

        const allQuests = await questDataManager.getAllQuests(guildId);
        const activeQuests = Object.values(allQuests).filter(q => !q.isArchived && !q.isClosed);

        const embedColor = await configDataManager.getEmbedColor(guildId);
        const embed = new EmbedBuilder()
            .setTitle('📜 クエスト掲示板')
            .setColor(embedColor)
            .setTimestamp();

        if (activeQuests.length > 0) {
            const questFields = activeQuests.map(quest => {
                const acceptedCount = quest.accepted?.filter(a => !a.status).reduce((sum, a) => sum + (a.people || a.players || 0), 0) || 0;
                const requiredCount = quest.people || quest.players || 1;
                return {
                    name: `🔹 ${quest.name || '無題のクエスト'}`,
                    value: `> **募集:** ${requiredCount}人\n> **現在:** ${acceptedCount}人\n> **ID:** \`${quest.id}\``,
                    inline: true
                };
            });
            embed.setDescription('現在募集中のクエスト一覧です。');
            embed.addFields(questFields);
        } else {
            embed.setDescription('現在、募集中のクエストはありません。');
        }

        const channel = await client.channels.fetch(dashboardConfig.channelId).catch(() => null);
        if (!channel || !channel.isTextBased()) {
            console.error(`[Dashboard] Dashboard channel ${dashboardConfig.channelId} not found or not a text channel for guild ${guildId}.`);
            return;
        }

        const message = await channel.messages.fetch(dashboardConfig.messageId).catch(() => null);
        if (message) {
            await message.edit({ embeds: [embed] });
        } else {
            console.warn(`[Dashboard] Dashboard message ${dashboardConfig.messageId} not found in channel ${dashboardConfig.channelId}. It may have been deleted. Removing config.`);
            await configDataManager.setDashboard(guildId, null, null);
        }
    } catch (error) {
        console.error(`[Dashboard] Failed to update dashboard for guild ${guildId}:`, error);
    }
}

module.exports = { updateDashboard };