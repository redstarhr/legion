// utils/questDataManager.js

const { initializeApp } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const crypto = require('crypto'); // ユニークID生成用

// .envのGOOGLE_APPLICATION_CREDENTIALSから自動で認証情報を読み込む
initializeApp();

const db = getFirestore();
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

/**
 * ギルドのデータをファイルから読み込む
 * @param {string} guildId
 * @returns {object} データベースオブジェクト。失敗した場合は初期オブジェクト。
 */
  } catch (error) {
    console.error(`[${guildId}] DBファイルの書き込みに失敗しました:`, error);
    return false;
  }
}

// 新しいクエストを作成して保存
function createQuest(guildId, messageId, questData) {
  const db = readData(guildId);
  db.quests[messageId] = {
    ...questData,
    messageId: messageId,
    guildId: guildId,
    linkedMessages: [],
    accepted: [],
    isClosed: false, // 募集が完了したかどうかのフラグ
    isArchived: false, // クエストが完了（アーカイブ）したかどうかのフラグ
  };
  return writeData(guildId, db);
}

// 既存のクエストを更新
function updateQuest(guildId, messageId, updatedFields) {
  const db = readData(guildId);
  if (db.quests[messageId]) {
    db.quests[messageId] = { ...db.quests[messageId], ...updatedFields };
    return writeData(guildId, db);
  }
  return false; // 更新対象が見つからない
}

// 特定のクエスト情報を取得
function getQuest(guildId, messageId) {
  const db = readData(guildId);
  return db.quests[messageId] || null;
}

// クエストを受注
function acceptQuest(guildId, messageId, acceptanceData) {
  const db = readData(guildId);
  if (db.quests[messageId]) {
    const quest = db.quests[messageId];

    // 現在の受注合計を計算
    const currentAcceptedTeams = quest.accepted.reduce((sum, a) => sum + a.teams, 0);
    const currentAcceptedPeople = quest.accepted.reduce((sum, a) => sum + a.people, 0);

    // 今回の受注を加えた場合に募集数を超えないかチェック
    if (currentAcceptedTeams + acceptanceData.teams > quest.teams) {
      return { error: `受注できる組数を超えています。(残り: ${quest.teams - currentAcceptedTeams}組)` };
    }
    if (currentAcceptedPeople + acceptanceData.people > quest.people) {
      return { error: `受注できる人数を超えています。(残り: ${quest.people - currentAcceptedPeople}人)` };
    }

    // 受注データにユニークなIDを付与
    const newAcceptance = {
      id: crypto.randomUUID(), // ユニークIDを生成
      ...acceptanceData,
    };
    quest.accepted.push(newAcceptance);
    if (writeData(guildId, db)) {
      return { quest: quest }; // 成功した場合、更新後のクエスト情報を返す
    } else {
      return null; // 書き込み失敗
    }
  }
  return null; // クエストが見つからない
}

/**
 * クエストの特定の受注を取り消す
 * @param {string} guildId
 * @param {string} messageId
 * @param {string} acceptanceId - 取り消す受注のユニークID
 * @returns {object|null} 更新後のクエストオブジェクト、またはnull（失敗時）
 */
function cancelQuestAcceptance(guildId, messageId, acceptanceId) {
  const db = readData(guildId);
  if (db.quests[messageId]) {
    const quest = db.quests[messageId];
    const initialLength = quest.accepted.length;
    quest.accepted = quest.accepted.filter(a => a.id !== acceptanceId);

    if (initialLength === quest.accepted.length) {
      // IDが見つからなかった場合
      return null;
    }

    if (writeData(guildId, db)) {
      return { quest: quest };
    }
  }
  return null;
}

/**
 * クエストを完了（アーカイブ）状態にする
 * @param {string} guildId
 * @param {string} messageId
 * @returns {object|null} 更新後のクエストオブジェクト、またはnull（失敗時）
 */
function archiveQuest(guildId, messageId) {
  const db = readData(guildId);
  if (db.quests[messageId]) {
    db.quests[messageId].isArchived = true;
    if (writeData(guildId, db)) {
      return { quest: db.quests[messageId] };
    }
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
      // 元のクエストオブジェクトと、見つかった連携情報の両方を返す
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