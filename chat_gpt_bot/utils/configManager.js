const { Storage } = require('@google-cloud/storage');

const GCS_BUCKET_NAME = process.env.GCS_BUCKET_NAME;
if (!GCS_BUCKET_NAME) {
  console.error("FATAL: GCS_BUCKET_NAME environment variable is not set. The bot cannot save data.");
  throw new Error("GCS_BUCKET_NAME is not configured.");
}
const storage = new Storage();
const bucket = storage.bucket(GCS_BUCKET_NAME);

const DATA_DIR_BASE = 'data-legion/chat_gpt';
const CONFIG_FILE_NAME = 'config.json';

/**
 * GCS上のファイルパスを生成する
 * @param {string} guildId
 * @returns {string} GCS object path
 */
function getGcsFilePath(guildId) {
  return `${DATA_DIR_BASE}/${guildId}/${CONFIG_FILE_NAME}`;
}

/**
 * ChatGPTの設定をGCSから読み込む
 * @param {string} guildId
 * @returns {Promise<object>}
 */
async function getChatGPTConfig(guildId) {
  const filePath = getGcsFilePath(guildId);
  const file = bucket.file(filePath);
  try {
    const [exists] = await file.exists();
    if (!exists) {
      return {}; // デフォルトの空オブジェクト
    }
    const [data] = await file.download();
    return JSON.parse(data.toString('utf8'));
  } catch (error) {
    console.error(`Error reading GCS file gs://${GCS_BUCKET_NAME}/${filePath}:`, error);
    throw error;
  }
}

/**
 * ChatGPTの設定をGCSへ書き込む
 * @param {string} guildId
 * @param {object} configData
 */
async function saveChatGPTConfig(guildId, configData) {
  const filePath = getGcsFilePath(guildId);
  const file = bucket.file(filePath);
  const currentConfig = await getChatGPTConfig(guildId).catch(() => ({}));
  const newConfig = { ...currentConfig, ...configData };
  await file.save(JSON.stringify(newConfig, null, 2), { contentType: 'application/json' });
}

module.exports = { getChatGPTConfig, saveChatGPTConfig };