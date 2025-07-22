// quest_bot/utils/questDataManager.js

const fs = require('fs/promises');
const path = require('path');

// __dirname は .../quest_bot/utils なので、2階層上がってプロジェクトルートを指定
const DATA_DIR = path.join(__dirname, '..', '..', 'data');
const QUESTS_FILE = 'quests.json';
const CONFIG_FILE = 'config.json';

/**
 * 指定されたギルドのデータディレクトリが存在することを確認し、なければ作成する
 * @param {string} guildId
 */
async function ensureGuildDir(guildId) {
  const guildDir = path.join(DATA_DIR, guildId);
  try {
    await fs.mkdir(guildDir, { recursive: true });
  } catch (error) {
    console.error(`Error creating directory for guild ${guildId}:`, error);
    throw error;
  }
}

/**
 * ギルドのJSONファイルを読み込む汎用関数
 * @param {string} guildId
 * @param {string} fileName
 * @param {object} defaultValue ファイルが存在しない場合のデフォルト値
 * @returns {Promise<object>}
 */
async function readGuildFile(guildId, fileName, defaultValue = {}) {
  const filePath = path.join(DATA_DIR, guildId, fileName);
  try {
    const data = await fs.readFile(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    if (error.code === 'ENOENT') {
      return defaultValue; // ファイルが存在しない場合はデフォルト値を返す
    }
    console.error(`Error reading file ${filePath}:`, error);
    throw error;
  }
}

/**
 * ギルドのJSONファイルに書き込む汎用関数
 * @param {string} guildId
 * @param {string} fileName
 * @param {object} data
 */
async function writeGuildFile(guildId, fileName, data) {
  await ensureGuildDir(guildId);
  const filePath = path.join(DATA_DIR, guildId, fileName);
  try {
    await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8');
  } catch (error) {
    console.error(`Error writing file ${filePath}:`, error);
    throw error;
  }
}

// --- Quest Data Functions ---

/**
 * ギルドのすべてのクエストを取得する
 * @param {string} guildId
 * @returns {Promise<object>} クエストIDをキーとするクエストオブジェクトのマップ
 */
async function getAllQuests(guildId) {
  return await readGuildFile(guildId, QUESTS_FILE, {});
}

/**
 * 特定のクエストを取得する
 * @param {string} guildId
 * @param {string} questId
 * @returns {Promise<object|null>}
 */
async function getQuest(guildId, questId) {
  const quests = await getAllQuests(guildId);
  return quests[questId] || null;
}

/**
 * 新しいクエストを作成する
 * @param {string} guildId
 * @param {string} questId
 * @param {object} questData
 * @param {import('discord.js').User} user - The user who created the quest.
 */
async function createQuest(guildId, questId, questData, user) {
  const quests = await getAllQuests(guildId);
  quests[questId] = {
    ...questData,
    messageId: questId,
    guildId: guildId,
    linkedMessages: questData.linkedMessages || [],
    // Add creation/update info
    lastUpdatedAt: new Date().toISOString(),
    lastUpdatedBy: {
      id: user.id,
      tag: user.tag,
    },
  };
  await writeGuildFile(guildId, QUESTS_FILE, quests);
}

/**
 * クエストを更新する
 * @param {string} guildId
 * @param {string} questId
 * @param {object} updates 更新するデータ
 * @param {import('discord.js').User} [user] - The user performing the update. Optional for system updates.
 * @returns {Promise<boolean>} 成功したかどうか
 */
async function updateQuest(guildId, questId, updates, user) {
  const quests = await getAllQuests(guildId);
  if (!quests[questId]) {
    console.warn(`[updateQuest] Quest not found: ${questId} in guild ${guildId}`);
    return false;
  }

  const updatedQuest = { ...quests[questId], ...updates };

  // Update timestamp and user info only if a user is provided
  if (user) {
    updatedQuest.lastUpdatedAt = new Date().toISOString();
    updatedQuest.lastUpdatedBy = {
      id: user.id,
      tag: user.tag,
    };
  }

  quests[questId] = updatedQuest;
  await writeGuildFile(guildId, QUESTS_FILE, quests);
  return true;
}

/**
 * 連携メッセージIDから元のクエストを探す
 * @param {string} guildId
 * @param {string} linkedMessageId
 * @returns {Promise<{originalQuest: object, linkedMessageInfo: object}|null>}
 */
async function findQuestByLinkedMessageId(guildId, linkedMessageId) {
  const allQuests = await getAllQuests(guildId);
  for (const questId in allQuests) {
    const quest = allQuests[questId];
    if (quest.linkedMessages && Array.isArray(quest.linkedMessages)) {
      const linkedInfo = quest.linkedMessages.find(link => link.messageId === linkedMessageId);
      if (linkedInfo) {
        return { originalQuest: quest, linkedMessageInfo: linkedInfo };
      }
    }
  }
  return null;
}

// --- Config Data Functions ---

async function getGuildConfig(guildId) {
  return await readGuildFile(guildId, CONFIG_FILE, {});
}

async function updateGuildConfig(guildId, updates) {
  const config = await getGuildConfig(guildId);
  const newConfig = { ...config, ...updates };
  await writeGuildFile(guildId, CONFIG_FILE, newConfig);
}

async function getQuestManagerRole(guildId) {
  const config = await getGuildConfig(guildId);
  return config.questManagerRoleId || null;
}

async function setQuestManagerRole(guildId, roleId) {
  await updateGuildConfig(guildId, { questManagerRoleId: roleId });
}

async function getLogChannel(guildId) {
  const config = await getGuildConfig(guildId);
  return config.logChannelId || null;
}

async function setLogChannel(guildId, channelId) {
  await updateGuildConfig(guildId, { logChannelId: channelId });
}

async function getNotificationChannel(guildId) {
  const config = await getGuildConfig(guildId);
  return config.notificationChannelId || null;
}

async function setNotificationChannel(guildId, channelId) {
  await updateGuildConfig(guildId, { notificationChannelId: channelId });
}

async function getEmbedColor(guildId) {
  const config = await getGuildConfig(guildId);
  return config.embedColor || '#00bfff'; // デフォルト色
}

async function setEmbedColor(guildId, color) {
  await updateGuildConfig(guildId, { embedColor: color });
}

// --- Button Order Config ---

const DEFAULT_BUTTON_ORDER = ['accept', 'cancel', 'edit', 'dm'];

/**
 * ギルドのボタン表示順設定を取得する
 * @param {string} guildId
 * @returns {Promise<string[]>}
 */
async function getButtonOrder(guildId) {
  const config = await getGuildConfig(guildId);
  // 設定がなければデフォルト順を返す
  return config.buttonOrder || DEFAULT_BUTTON_ORDER;
}

/**
 * ギルドのボタン表示順を設定する
 * @param {string} guildId
 * @param {string[]} order
 */
async function setButtonOrder(guildId, order) {
  await updateGuildConfig(guildId, { buttonOrder: order });
}

// --- Utility for Deadline Manager ---

/**
 * データが存在するすべてのギルドIDのリストを取得する
 * @returns {Promise<string[]>}
 */
async function getAllGuildIds() {
  try {
    // dataディレクトリ直下のディレクトリ名をギルドIDとして取得
    const entries = await fs.readdir(DATA_DIR, { withFileTypes: true });
    return entries.filter(dirent => dirent.isDirectory()).map(dirent => dirent.name);
  } catch (error) {
    if (error.code === 'ENOENT') {
      return []; // dataディレクトリ自体が存在しない場合は空配列
    }
    console.error('Error reading guild directories:', error);
    throw error;
  }
}

module.exports = {
  getAllQuests,
  getQuest,
  createQuest,
  updateQuest,
  findQuestByLinkedMessageId,
  getGuildConfig,
  getQuestManagerRole,
  setQuestManagerRole,
  getLogChannel,
  setLogChannel,
  getNotificationChannel,
  setNotificationChannel,
  getEmbedColor,
  setEmbedColor,
  getButtonOrder,
  setButtonOrder,
  getAllGuildIds, // deadlineManagerのためにエクスポート
};