// e:/共有フォルダ/legion/quest_bot/utils/deadlineManager.js
const questDataManager = require('../../manager/questDataManager');
const { updateQuestMessage } = require('./questMessageManager');
const { updateDashboard } = require('./dashboardManager');
const { sendDeadlineNotification } = require('./notificationManager');
const { logAction } = require('./logger');

/**
 * Checks for quests whose deadline has passed and automatically closes them.
 * @param {import('discord.js').Client} client The Discord client instance.
 */
async function checkAndCloseExpiredQuests(client) {
    try {
        const guilds = client.guilds.cache;

        for (const guild of guilds.values()) {
            const quests = await questDataManager.getAllQuests(guild.id);
            const now = new Date();

            for (const questId of Object.keys(quests)) {
                const quest = quests[questId];

                // 期限があり、まだ締め切られておらず、アーカイブもされていないクエストを対象
                if (quest.deadline && !quest.isClosed && !quest.isArchived) {
                    const deadlineDate = new Date(quest.deadline);

                    if (now > deadlineDate) {
                        console.log(`[Deadline] Quest "${quest.name}" (ID: ${questId}) in guild ${guild.id} has expired. Closing...`);

                        const updatedQuest = await questDataManager.updateQuest(guild.id, questId, { isClosed: true }, client.user);

                        await updateQuestMessage(client, updatedQuest);
                        await updateDashboard(client, guild.id);

                        await logAction({ client, guildId: guild.id, user: client.user }, {
                            title: '⏰ 募集期限切れ',
                            color: '#e67e22',
                            description: `クエスト「${quest.name}」が期限を過ぎたため、自動的に募集を締め切りました。`,
                            details: { 'クエストID': questId },
                        });

                        // 募集期限切れの通知は現在不要なため、処理をコメントアウト
                        // await sendDeadlineNotification({ client, quest: updatedQuest });
                    }
                }
            }
        }
    } catch (error) {
        console.error('[Deadline] Error during checkAndCloseExpiredQuests:', error);
    }
}

module.exports = { checkAndCloseExpiredQuests };