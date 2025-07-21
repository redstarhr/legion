// utils/questDataManager.js

const { db } = require('./firestore'); // Firestoreインスタンスをインポート
const crypto = require('crypto'); // ユニークID生成用

const guildsCollection = db.collection('guilds');

/**
 * ギルドのデータをFirestoreから取得する。ドキュメントが存在しない場合は作成する。
 * @param {string} guildId
 * @returns {Promise<object>} ギルドのデータオブジェクト
 */
async function getGuildData(guildId) {
  if (!guildId) throw new Error('Guild ID is required.');
  const docRef = guildsCollection.doc(guildId);
  const docSnap = await docRef.get();

  if (docSnap.exists()) {
    return docSnap.data();
  } else {
    // ドキュメントが存在しない場合、初期データで作成
    const initialData = {
      quests: {},
      config: {
        questManagerRoleId: null,
        logChannelId: null,
        notificationChannelId: null,
        embedColor: '#00bfff',
      },
    };
    await docRef.set(initialData);
    return initialData;
  }
}

// 新しいクエストを作成して保存
async function createQuest(guildId, messageId, questData) {
  const data = await getGuildData(guildId);
  data.quests[messageId] = {
    ...questData,
    messageId: messageId,
    guildId: guildId,
    linkedMessages: [],
    accepted: [],
    isClosed: false,
    isArchived: false,
  };
  await guildsCollection.doc(guildId).set(data);
  return true;
}

// 既存のクエストを更新
async function updateQuest(guildId, messageId, updatedFields) {
  const data = await getGuildData(guildId);
  if (data.quests[messageId]) {
    data.quests[messageId] = { ...data.quests[messageId], ...updatedFields };
    await guildsCollection.doc(guildId).set(data);
    return true;
  }
  return false;
}

// 特定のクエスト情報を取得
async function getQuest(guildId, messageId) {
  const data = await getGuildData(guildId);
  return data.quests[messageId] || null;
}

// クエストを受注
async function acceptQuest(guildId, messageId, acceptanceData) {
  const data = await getGuildData(guildId);
  if (data.quests[messageId]) {
    const quest = data.quests[messageId];

    const currentAcceptedTeams = quest.accepted.reduce((sum, a) => sum + a.teams, 0);
    const currentAcceptedPeople = quest.accepted.reduce((sum, a) => sum + a.people, 0);

    if (currentAcceptedTeams + acceptanceData.teams > quest.teams) {
      return { error: `受注できる組数を超えています。(残り: ${quest.teams - currentAcceptedTeams}組)` };
    }
    if (currentAcceptedPeople + acceptanceData.people > quest.people) {
      return { error: `受注できる人数を超えています。(残り: ${quest.people - currentAcceptedPeople}人)` };
    }

    const newAcceptance = {
      id: crypto.randomUUID(),
      ...acceptanceData,
    };
    quest.accepted.push(newAcceptance);
    await guildsCollection.doc(guildId).set(data);
    return { quest: quest };
  }
  return null;
}

// クエストの特定の受注を取り消す
async function cancelQuestAcceptance(guildId, messageId, acceptanceId) {
  const data = await getGuildData(guildId);
  if (data.quests[messageId]) {
    const quest = data.quests[messageId];
    const initialLength = quest.accepted.length;
    quest.accepted = quest.accepted.filter(a => a.id !== acceptanceId);

    if (initialLength === quest.accepted.length) {
      return null;
    }

    await guildsCollection.doc(guildId).set(data);
    return { quest: quest };
  }
  return null;
}

// クエストを完了（アーカイブ）状態にする
async function archiveQuest(guildId, messageId) {
  const data = await getGuildData(guildId);
  if (data.quests[messageId]) {
    data.quests[messageId].isArchived = true;
    await guildsCollection.doc(guildId).set(data);
    return { quest: data.quests[messageId] };
  }
  return null;
}

// 連携先のメッセージIDから元のクエスト情報を検索する
async function findQuestByLinkedMessageId(guildId, linkedMessageId) {
  const data = await getGuildData(guildId);
  for (const questId in data.quests) {
    const quest = data.quests[questId];
    const foundLink = quest.linkedMessages.find(link => link.messageId === linkedMessageId);
    if (foundLink) {
      return { originalQuest: quest, linkedMessageInfo: foundLink };
    }
  }
  return null;
}

// ギルドのすべてのクエストを取得する
async function getAllQuests(guildId) {
  const data = await getGuildData(guildId);
  return data.quests || {};
}

// クエスト管理者ロールIDを設定する
async function setQuestManagerRole(guildId, roleId) {
  const data = await getGuildData(guildId);
  data.config.questManagerRoleId = roleId;
  await guildsCollection.doc(guildId).set(data);
  return true;
}

// クエスト管理者ロールIDを取得する
async function getQuestManagerRole(guildId) {
  const data = await getGuildData(guildId);
  return data.config?.questManagerRoleId || null;
}

// ログチャンネルIDを設定する
async function setLogChannel(guildId, channelId) {
  const data = await getGuildData(guildId);
  data.config.logChannelId = channelId;
  await guildsCollection.doc(guildId).set(data);
  return true;
}

// ログチャンネルIDを取得する
async function getLogChannel(guildId) {
  const data = await getGuildData(guildId);
  return data.config?.logChannelId || null;
}

// クエスト通知チャンネルIDを設定する
async function setNotificationChannel(guildId, channelId) {
  const data = await getGuildData(guildId);
  data.config.notificationChannelId = channelId;
  await guildsCollection.doc(guildId).set(data);
  return true;
}

// クエスト通知チャンネルIDを取得する
async function getNotificationChannel(guildId) {
  const data = await getGuildData(guildId);
  return data.config?.notificationChannelId || null;
}

// Embedの色を設定する
async function setEmbedColor(guildId, color) {
  const data = await getGuildData(guildId);
  data.config.embedColor = color;
  await guildsCollection.doc(guildId).set(data);
  return true;
}

// Embedの色を取得する
async function getEmbedColor(guildId) {
  const data = await getGuildData(guildId);
  return data.config?.embedColor || '#00bfff';
}

module.exports = {
  createQuest,
  updateQuest,
  getQuest,
  acceptQuest,
  cancelQuestAcceptance,
  archiveQuest,
  findQuestByLinkedMessageId,
  getAllQuests,
  setQuestManagerRole,
  getQuestManagerRole,
  setLogChannel,
  getLogChannel,
  setNotificationChannel,
  getNotificationChannel,
  setEmbedColor,
  getEmbedColor,
};