// manager/questDataManager.js

const { Storage } = require('@google-cloud/storage');
const { nanoid } = require('nanoid');

// --- GCS Configuration ---
const GCS_BUCKET_NAME = process.env.GCS_BUCKET_NAME;
if (!GCS_BUCKET_NAME) {
  console.error("FATAL: GCS_BUCKET_NAME environment variable is not set. The bot cannot save data.");
  throw new Error("GCS_BUCKET_NAME is not configured.");
}
const storage = new Storage();
const bucket = storage.bucket(GCS_BUCKET_NAME);

const DATA_DIR_BASE = 'data-legion/quest';
const QUESTS_FILE_NAME = 'quests.json';
const QUEST_LOG_DIR = 'quest';

/**
 * GCS上のファイルパスを生成する
 * @param {string} guildId
 * @param {string} fileName
 * @returns {string} GCS object path
 */
function getGcsFilePath(guildId, fileName) {
  return `${DATA_DIR_BASE}/${guildId}/${fileName}`;
}

/**
 * GCSからJSONファイルを読み込む汎用関数
 * @param {string} guildId
 * @param {string} fileName
 * @param {object} defaultValue ファイルが存在しない場合のデフォルト値
 * @returns {Promise<object>}
 */
async function readGcsFile(guildId, fileName, defaultValue = {}) {
  const filePath = getGcsFilePath(guildId, fileName);
  const file = bucket.file(filePath);
  try {
    const [exists] = await file.exists();
    if (!exists) {
      return defaultValue;
    }
    const [data] = await file.download();
    return JSON.parse(data.toString('utf8'));
  } catch (error) {
    console.error(`Error reading GCS file gs://${GCS_BUCKET_NAME}/${filePath}:`, error);
    throw error;
  }
}

/**
 * GCSへJSONファイルを書き込む汎用関数
 * @param {string} guildId
 * @param {string} fileName
 * @param {object} data
 */
async function writeGcsFile(guildId, fileName, data) {
  const filePath = getGcsFilePath(guildId, fileName);
  const file = bucket.file(filePath);
  try {
    await file.save(JSON.stringify(data, null, 2), { contentType: 'application/json' });
  } catch (error) {
    console.error(`Error writing GCS file gs://${GCS_BUCKET_NAME}/${filePath}:`, error);
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
  return await readGcsFile(guildId, QUESTS_FILE_NAME, {});
}

/**
 * 特定のクエストを取得する
 * @param {string} guildId
 * @param {string} questId
 * @returns {Promise<object|null>}
 */
async function getQuest(guildId, questId) {
  const quests = await getAllQuests(guildId);
  const quest = quests[questId];
  if (quest) {
    // 他のモジュールで使いやすいように guildId を注入する
    quest.guildId = guildId;
  }
  return quest || null;
}

/**
 * 新しいクエストを作成する
 * @param {string} guildId
 * @param {object} questDetails - The details of the new quest (name, players, teams).
 * @param {import('discord.js').User} user - The user who created the quest.
 * @returns {Promise<object>} The newly created quest object.
 */
async function createQuest(guildId, questDetails, user) {
  const quests = await getAllQuests(guildId);
  const newQuestId = `q_${nanoid(8)}`;

  if (quests[newQuestId]) {
      console.error(`[createQuest] Quest with ID ${newQuestId} already exists in guild ${guildId}. This is a rare collision.`);
      return null;
  }

  const newQuest = {
    name: questDetails.name,
    players: questDetails.players,
    people: questDetails.players, // 互換性のために追加
    teams: questDetails.teams,
    id: newQuestId,
    issuerId: user.id,
    createdAt: new Date().toISOString(),
    accepted: [],
    isClosed: false,
    isArchived: false,
  };
  quests[newQuestId] = newQuest;
  await writeGcsFile(guildId, QUESTS_FILE_NAME, quests);
  return newQuest;
}

/**
 * クエストを更新する
 * @param {string} guildId
 * @param {string} questId
 * @param {object} updates 更新するデータ
 * @param {import('discord.js').User} [user] - The user performing the update. Optional for system updates.
 * @returns {Promise<object|null>} The updated quest object, or null if not found.
 */
async function updateQuest(guildId, questId, updates, user) {
  const quests = await getAllQuests(guildId);
  if (!quests[questId]) {
    console.warn(`[updateQuest] Quest not found: ${questId} in guild ${guildId}`);
    return null;
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
  await writeGcsFile(guildId, QUESTS_FILE_NAME, quests);
  return updatedQuest;
}

// --- Utility for Deadline Manager ---

/**
 * データが存在するすべてのギルドIDのリストを取得する
 * @returns {Promise<string[]>}
 */
async function getAllGuildIds() {
  // GCSで 'data/' プレフィックス以下の "ディレクトリ" (共通プレフィックス) を一覧する
  try {
    const query = {
      prefix: `${DATA_DIR_BASE}/`,
      delimiter: '/',
    };
    const [_, __, apiResponse] = await bucket.getFiles(query);

    if (apiResponse.prefixes) {
      // apiResponse.prefixes は 'data/guildId1/', 'data/guildId2/' のような形式で返ってくる
      return apiResponse.prefixes.map(p => p.replace(query.prefix, '').replace('/', ''));
    }
    return [];
  } catch (error) {
    console.error('Error listing guild directories in GCS:', error);
    return []; // エラー時は空配列を返し、ボットのクラッシュを防ぐ
  }
}

/**
 * Gets all active, non-failed acceptances across all quests.
 * Can be filtered by a specific user.
 * @param {string} guildId
 * @param {string} [userId] - Optional. If provided, only returns acceptances for this user.
 * @returns {Promise<object[]>} An array of acceptance objects, each enhanced with questId and questName.
 */
async function getActiveAcceptances(guildId, userId = null) {
  const allQuests = await getAllQuests(guildId);
  const activeQuests = Object.values(allQuests).filter(q => !q.isArchived);

  return activeQuests.flatMap(quest =>
    quest.accepted
      .filter(acceptance => {
        // Filter out failed ones
        if (acceptance.status === 'failed') return false;
        // If a userId is provided, filter for that user
        if (userId && acceptance.userId !== userId) return false;
        return true;
      })
      .map(acceptance => ({
        questId: quest.id,
        questName: quest.name || '無題のクエスト',
        ...acceptance,
      }))
  );
}

/**
 * 今日の日付を 'YYYY-MM-DD' 形式で取得する (JST)
 * @returns {string}
 */
function getTodayDateString() {
  // タイムゾーンをAsia/Tokyoに設定してフォーマット
  // 'sv-SE' ロケールは 'YYYY-MM-DD' 形式を返すため、文字列操作より堅牢
  return new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Tokyo' });
}

/**
 * クエストデータを処理し、日次報告のペイロードとクリーンアップされたクエストリストを生成する。
 * この関数は副作用（I/Oなど）を持たない。
 * @param {object} allQuests - 元となる全てのクエストオブジェクトのマップ。
 * @returns {{
 *   summaryPayload: {completedQuests: object[], failedParticipants: object[]}|null,
 *   cleanedQuests: object,
 *   hasChanges: boolean
 * }}
 * @private
 */
function _prepareEndOfDayReport(allQuests) {
  const cleanedQuests = {};
  const completedQuests = [];
  const completedParticipants = [];
  const failedParticipants = [];
  let hasChanges = false;

  for (const questId in allQuests) {
    const quest = allQuests[questId];

    // 1. 完了済み (アーカイブ済み) クエストの処理
    if (quest.isArchived) {
      completedQuests.push({ ...quest });
      hasChanges = true;
      continue; // クリーンアップされたリストには含めない
    }

    // 2. アクティブなクエストの処理と、完了/失敗した参加者の集計
    const activeParticipants = [];
    let questDataChanged = false;

    if (Array.isArray(quest.accepted)) {
      for (const p of quest.accepted) {
        if (p.status === 'completed') {
          completedParticipants.push({
            questId: quest.id,
            questName: quest.name || '無題のクエスト',
            ...p,
          });
          questDataChanged = true;
        } else if (p.status === 'failed') {
          failedParticipants.push({
            questId: quest.id,
            questName: quest.name || '無題のクエスト',
            userId: p.userId,
            userTag: p.userTag, // ログ用にユーザー情報も追加
            teams: p.teams,
            people: p.people,
            reason: p.reason || '理由なし',
          });
          questDataChanged = true;
        } else {
          activeParticipants.push(p);
        }
      }
    }

    // 失敗した参加者がいた場合、クエストデータが変更されたことになる
    if (questDataChanged) {
      hasChanges = true;
      const updatedQuest = { ...quest, accepted: activeParticipants };
      cleanedQuests[questId] = updatedQuest;
    } else {
      // 変更がないクエストはそのまま引き継ぐ
      cleanedQuests[questId] = quest;
    }
  }

  const hasReportableItems = completedQuests.length > 0 || completedParticipants.length > 0 || failedParticipants.length > 0;

  const summaryPayload = hasReportableItems
    ? { completedQuests, completedParticipants, failedParticipants }
    : null;

  return { summaryPayload, cleanedQuests, hasChanges };
}

/**
 * 「1日の終わり」処理を実行する。
 * 完了/失敗したクエストを集計し、日次ログとして保存後、元のクエストデータをクリーンアップする。
 * @param {string} guildId
 * @returns {Promise<{
 *   success: boolean,
 *   summary?: {
 *     date: string, completedParticipants: object[],
 *     completedQuests: object[],
 *     failedParticipants: object[],
 *   },
 *   error?: string
 * }>}
 */
async function processEndOfDay(guildId) {
  const allQuests = await getAllQuests(guildId);

  // 純粋なデータ処理関数を呼び出す
  const { summaryPayload, cleanedQuests, hasChanges } = _prepareEndOfDayReport(allQuests);

  // 報告対象がなければ早期に終了
  if (!summaryPayload) {
    return { success: false, error: '報告対象のクエスト完了または失敗がありません。' };
  }

  const todayStr = getTodayDateString();
  const dailyLogFileName = `${QUEST_LOG_DIR}/${todayStr}_quest.json`;

  const finalSummary = {
    date: new Date().toISOString(),
    ...summaryPayload,
  };

  try {
    // 1. 日次ログをGCSに保存する
    await writeGcsFile(guildId, dailyLogFileName, finalSummary);

    // 2. 元のデータに変更があった場合、クリーンアップされたクエストリストで上書き保存する
    if (hasChanges) {
      await writeGcsFile(guildId, QUESTS_FILE_NAME, cleanedQuests);
    }

    return { success: true, summary: finalSummary };
  } catch (error) {
    console.error(`[processEndOfDay] Error processing for guild ${guildId}:`, error);
    return { success: false, error: '日次処理中にエラーが発生しました。' };
  }
}

/**
 * Deletes all data associated with a specific guild when the bot leaves.
 * This includes quest data, config files, and logs.
 * @param {string} guildId The ID of the guild to delete data for.
 * @returns {Promise<void>}
 */
async function deleteGuildData(guildId) {
  const prefix = `${DATA_DIR_BASE}/${guildId}/`;
  try {
    await bucket.deleteFiles({ prefix: prefix });
    console.log(`[DataCleanup] Successfully deleted all data for guild ${guildId} with prefix gs://${GCS_BUCKET_NAME}/${prefix}`);
  } catch (error) {
    console.error(`[DataCleanup] Failed to delete data for guild ${guildId}:`, error);
    // We don't re-throw here, just log the error. The bot should not crash.
  }
}

module.exports = {
  getAllQuests,
  getQuest,
  createQuest,
  updateQuest,
  getAllGuildIds, // deadlineManagerのためにエクスポート
  getActiveAcceptances,
  processEndOfDay,
  deleteGuildData,
};