// utils/deadlineManager.js

const { EmbedBuilder } = require('discord.js');
const questDataManager = require('./questDataManager');
const { logAction } = require('./logger');
const { updateQuestMessage } = require('./questMessageManager');

/**
 * Checks for and closes any quests that have passed their deadline.
 * @param {import('discord.js').Client} client The Discord client instance.
 */
async function checkAndCloseExpiredQuests(client) {
  try {
    const guildIds = await questDataManager.getAllGuildIds();
    if (guildIds.length === 0) {
      return;
    }

    for (const guildId of guildIds) {
      const allQuests = await questDataManager.getAllQuests(guildId);

      for (const questId in allQuests) {
        const quest = allQuests[questId];

        // Check only quests that have a deadline and are not already closed or archived.
        if (quest.deadline && !quest.isClosed && !quest.isArchived) {
          try {
            const deadlineDate = new Date(quest.deadline);
            if (deadlineDate < new Date()) {
              // Found an expired quest.
              console.log(`[${guildId}] Expired quest found: ${questId}`);

              // 1. Update the quest to be closed.
              await questDataManager.updateQuest(guildId, questId, { isClosed: true });
              const updatedQuest = await questDataManager.getQuest(guildId, questId);
              if (!updatedQuest) continue;

              // 2. Update the original quest message
              await updateQuestMessage(client, updatedQuest);

              // 3. Send a notification to the notification channel.
              const notificationChannelId = await questDataManager.getNotificationChannel(guildId);
              if (notificationChannelId) {
                try {
                  const notificationChannel = await client.channels.fetch(notificationChannelId);
                  if (notificationChannel?.isTextBased()) {
                    const notificationEmbed = new EmbedBuilder().setColor(0xf4900c).setTitle('⏰ クエスト期限切れ通知').setDescription(`クエスト「${updatedQuest.title || '無題のクエスト'}」が設定された期限を過ぎたため、自動的に募集を締め切りました。`).setTimestamp();
                    await notificationChannel.send({ embeds: [notificationEmbed] });
                  }
                } catch (notificationError) {
                  console.error(`[${guildId}] Failed to send deadline notification for quest ${questId}:`, notificationError);
                }
              }

              // 4. Log the action.
              const pseudoInteraction = { client, guildId, user: client.user };
              await logAction(pseudoInteraction, {
                title: '⏰ クエスト期限切れ',
                color: '#e67e22',
                details: {
                  'クエストタイトル': updatedQuest.title || '無題',
                  'クエストID': questId,
                },
              });
            }
          } catch (e) {
            console.error(`[${guildId}] Deadline check failed for quest ${questId}:`, e);
          }
        }
      }
    }
  } catch (error) {
    console.error('Error fetching guilds for deadline check:', error);
  }
}

module.exports = { checkAndCloseExpiredQuests };