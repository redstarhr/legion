// utils/questDataManager.js

const crypto = require('crypto'); // ユニークID生成用
const fs = require('fs');
const path = require('path');

// データベースファイルを保存するディレクトリ
const dataDir = path.join(__dirname, '..', 'data');

// データディレクトリが存在しない場合に作成
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

/**
 * ギルドIDに対応するDBファイルのパスを取得
 * @param {string} guildId
 * @returns {string}
 */
function getGuildDbPath(guildId) {
  if (!guildId) throw new Error('Guild ID is required.');
  return path.join(dataDir, `${guildId}.json`);
}

/**
 * ギルドのデータをファイルから読み込む
 * @param {string} guildId
 * @returns {object} データベースオブジェクト。失敗した場合は初期オブジェクト。
 */
function readData(guildId) {
  const dbPath = getGuildDbPath(guildId);
  const initialData = { quests: {}, config: { questManagerRoleId: null, logChannelId: null, notificationChannelId: null, embedColor: '#00bfff' } };

  if (!fs.existsSync(dbPath)) {
    // ファイルが存在しない場合は初期データで作成
    try {
      fs.writeFileSync(dbPath, JSON.stringify(initialData, null, 2));
      return initialData;
    } catch (error) {
      console.error(`[${guildId}] DBファイルの初期化に失敗しました:`, error);
      return initialData; // エラー時も初期データを返す
    }
  }

  try {
    const rawData = fs.readFileSync(dbPath);
    const data = JSON.parse(rawData);
    // 古いデータファイルとの互換性のため
    if (!data.config) {
      data.config = { questManagerRoleId: null, logChannelId: null, notificationChannelId: null, embedColor: '#00bfff' };
    } else {
      if (data.config.logChannelId === undefined) data.config.logChannelId = null;
      if (data.config.notificationChannelId === undefined) data.config.notificationChannelId = null;
      if (data.config.embedColor === undefined) data.config.embedColor = '#00bfff';
    }
    return data;
  } catch (error) {
    console.error(`[${guildId}] DBファイルの読み込みに失敗しました:`, error);
    return initialData; // エラー時も初期データを返す
  }
}

/**
 * ギルドのデータをファイルに書き込む
 * @param {string} guildId
 * @param {object} data
 * @returns {boolean} 成功した場合はtrue、失敗した場合はfalse
 */
function writeData(guildId, data) {
  const dbPath = getGuildDbPath(guildId);
  try {
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
    return true;
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

/**
 * 連携先のメッセージIDから元のクエスト情報を検索する
 * @param {string} guildId
 * @param {string} linkedMessageId - 連携されているメッセージのID
 * @returns {object|null} { originalQuest, linkedMessageInfo } を含むオブジェクト、またはnull
 */
function findQuestByLinkedMessageId(guildId, linkedMessageId) {
  const db = readData(guildId);
  for (const questId in db.quests) {
    const quest = db.quests[questId];
    const foundLink = quest.linkedMessages.find(link => link.messageId === linkedMessageId);
    if (foundLink) {
      // 元のクエストオブジェクトと、見つかった連携情報の両方を返す
      return { originalQuest: quest, linkedMessageInfo: foundLink };
    }
  }
  return null;
}

/**
 * ギルドのすべてのクエストを取得する
 * @param {string} guildId
 * @returns {object} クエストIDをキーとするクエストオブジェクトのマップ
 */
function getAllQuests(guildId) {
  const db = readData(guildId);
  return db.quests || {};
}

/**
 * クエスト管理者ロールIDを設定する
 * @param {string} guildId
 * @param {string|null} roleId
 * @returns {boolean}
 */
function setQuestManagerRole(guildId, roleId) {
  const db = readData(guildId);
  db.config.questManagerRoleId = roleId;
  return writeData(guildId, db);
}

/**
 * クエスト管理者ロールIDを取得する
 * @param {string} guildId
 * @returns {string|null}
 */
function getQuestManagerRole(guildId) {
  const db = readData(guildId);
  return db.config?.questManagerRoleId || null;
}

/**
 * ログチャンネルIDを設定する
 * @param {string} guildId
 * @param {string|null} channelId
 * @returns {boolean}
 */
function setLogChannel(guildId, channelId) {
  const db = readData(guildId);
  db.config.logChannelId = channelId;
  return writeData(guildId, db);
}

/**
 * ログチャンネルIDを取得する
 * @param {string} guildId
 * @returns {string|null}
 */
function getLogChannel(guildId) {
  const db = readData(guildId);
  return db.config?.logChannelId || null;
}

/**
 * クエスト通知チャンネルIDを設定する
 * @param {string} guildId
 * @param {string|null} channelId
 * @returns {boolean}
 */
function setNotificationChannel(guildId, channelId) {
  const db = readData(guildId);
  db.config.notificationChannelId = channelId;
  return writeData(guildId, db);
}

/**
 * クエスト通知チャンネルIDを取得する
 * @param {string} guildId
 * @returns {string|null}
 */
function getNotificationChannel(guildId) {
  const db = readData(guildId);
  return db.config?.notificationChannelId || null;
}

/**
 * Embedの色を設定する
 * @param {string} guildId
 * @param {string} color
 * @returns {boolean}
 */
function setEmbedColor(guildId, color) {
  const db = readData(guildId);
  db.config.embedColor = color;
  return writeData(guildId, db);
}

/**
 * Embedの色を取得する
 * @param {string} guildId
 * @returns {import('discord.js').ColorResolvable}
 */
function getEmbedColor(guildId) {
  const db = readData(guildId);
  return db.config?.embedColor || '#00bfff';
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