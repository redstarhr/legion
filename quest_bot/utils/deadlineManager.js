// utils/deadlineManager.js

const { EmbedBuilder } = require('discord.js');
const { getFirestore } = require('firebase-admin/firestore');
const questDataManager = require('./questDataManager');
const { logAction } = require('./logger');
const { updateAllQuestMessages } = require('./messageUpdater');

const db = getFirestore();

/**
 * Checks for and closes any quests that have passed their deadline.
 * @param {import('discord.js').Client} client The Discord client instance.
 */
async function checkAndCloseExpiredQuests(client) {
  try {
    const guildsSnapshot = await db.collection('guilds').get();
    if (guildsSnapshot.empty) {
      return;
    }

    for (const doc of guildsSnapshot.docs) {
      const guildId = doc.id;
      const guildData = doc.data();
      const allQuests = guildData.quests || {};

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

              // 2. 共通関数を使って全ての関連メッセージを更新
              await updateAllQuestMessages(client, updatedQuest, null);

              // 3. Send a notification to the notification channel.
              const notificationChannelId = await questDataManager.getNotificationChannel(guildId);
              if (notificationChannelId) {
                const notificationChannel = await client.channels.fetch(notificationChannelId);
                const notificationEmbed = new EmbedBuilder().setColor(0xf4900c).setTitle('⏰ クエスト期限切れ通知').setDescription(`クエスト「${updatedQuest.title || '無題のクエスト'}」が設定された期限を過ぎたため、自動的に募集を締め切りました。`).setTimestamp();
                if (notificationChannel?.isTextBased()) await notificationChannel.send({ embeds: [notificationEmbed] });
              }

              // 4. Log the action.
              const pseudoInteraction = { client, guildId, user: client.user };
              await logAction(pseudoInteraction, 'クエスト期限切れ', `クエストID: ${questId} が期限切れのため自動クローズされました。`);
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