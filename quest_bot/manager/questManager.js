// manager/questManager.js

const questDataManager = require('./questDataManager');

async function createNewQuest(guildId, questDetails, user) {
  // 必要なバリデーションや追加処理をここに入れる
  // 例：必須項目チェック、文字数制限など
  return await questDataManager.createQuest(guildId, questDetails, user);
}

async function acceptQuest(guildId, questId, userId, userTag) {
  const quest = await questDataManager.getQuest(guildId, questId);
  if (!quest) throw new Error('クエストが見つかりません。');

  // すでに受注済みチェック
  if (quest.accepted.some(a => a.userId === userId && a.status !== 'failed')) {
    throw new Error('すでにこのクエストを受注しています。');
  }

  quest.accepted.push({
    userId,
    userTag,
    acceptedAt: new Date().toISOString(),
    status: 'accepted',
  });

  return await questDataManager.updateQuest(guildId, questId, { accepted: quest.accepted });
}

async function completeQuestAcceptance(guildId, questId, userId) {
  const quest = await questDataManager.getQuest(guildId, questId);
  if (!quest) throw new Error('クエストが見つかりません。');

  const acceptance = quest.accepted.find(a => a.userId === userId && a.status === 'accepted');
  if (!acceptance) throw new Error('このクエストの受注が見つかりません。');

  acceptance.status = 'completed';
  acceptance.completedAt = new Date().toISOString();

  return await questDataManager.updateQuest(guildId, questId, { accepted: quest.accepted });
}

// 他にキャンセル、失敗報告、編集、一覧取得など必要に応じて作成してください

module.exports = {
  createNewQuest,
  acceptQuest,
  completeQuestAcceptance,
};
