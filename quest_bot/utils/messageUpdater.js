// utils/messageUpdater.js

const { createQuestEmbed } = require('./embeds');
const { createQuestActionRow } = require('../components/questActionButtons');

/**
 * クエスト掲示板と、連携されている全てのメッセージを更新する
 * @param {import('discord.js').Client} client
 * @param {object} quest - 更新後のクエストオブジェクト
 * @param {string} userId - インタラクションを実行したユーザーのID
 */
async function updateAllQuestMessages(client, quest, userId) {
  const updatedEmbed = createQuestEmbed(quest);
  const updatedButtons = createQuestActionRow(quest, userId);

  const updatePromises = [];

  // 元のメッセージを更新
  if (quest.channelId && quest.messageId) {
    const promise = client.channels.fetch(quest.channelId).then(c => c?.messages.fetch(quest.messageId)).then(m => m?.edit({ embeds: [updatedEmbed], components: [updatedButtons] }));
    updatePromises.push(promise.catch(err => console.error(`[MessageUpdater] 元のメッセージの更新に失敗: ${quest.messageId}`, err)));
  }

  // 連携先のメッセージを更新
  if (quest.linkedMessages) {
    for (const linked of quest.linkedMessages) {
      const promise = client.channels.fetch(linked.channelId).then(c => c?.messages.fetch(linked.messageId)).then(m => m?.edit({ embeds: [updatedEmbed], components: [updatedButtons] }));
      updatePromises.push(promise.catch(err => console.error(`[MessageUpdater] 連携メッセージの更新に失敗: ch:${linked.channelId}, msg:${linked.messageId}`, err)));
    }
  }

  await Promise.all(updatePromises);
}

module.exports = { updateAllQuestMessages };