// utils/deadlineManager.js

const { EmbedBuilder } = require('discord.js');
const questDataManager = require('./questDataManager');
const { logAction } = require('./logger');
const { updateQuestMessage } = require('./questMessageManager');
const { sendDeadlineNotification } = require('./notificationManager');

let isChecking = false; // Lock to prevent overlapping executions

/**
 * Checks for and closes any quests that have passed their deadline.
 * @param {import('discord.js').Client} client The Discord client instance.
 */
async function checkAndCloseExpiredQuests(client) {
  if (isChecking) {
    console.log('[DeadlineManager] A check is already in progress. Skipping.');
    return;
  }
  isChecking = true;

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

              // 1. Update the quest to be closed and get the updated object.
              const updatedQuest = await questDataManager.updateQuest(guildId, questId, { isClosed: true });
              if (!updatedQuest) {
                console.warn(`[${guildId}] Failed to update expired quest ${questId}, or it was not found.`);
                continue;
              }

              // 2. Update the original quest message
              await updateQuestMessage(client, updatedQuest);

              // 3. Send a notification to the notification channel.
              await sendDeadlineNotification({ client, quest: updatedQuest });

              // 4. Log the action.
              await logAction({ client, guildId, user: client.user }, {
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
  } finally {
    isChecking = false;
  }
}

module.exports = { checkAndCloseExpiredQuests };