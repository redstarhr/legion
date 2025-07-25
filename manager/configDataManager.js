// manager/configDataManager.js

const { Storage } = require('@google-cloud/storage');

const GCS_BUCKET_NAME = process.env.GCS_BUCKET_NAME;
if (!GCS_BUCKET_NAME) {
  throw new Error("GCS_BUCKET_NAME is not configured.");
}
const storage = new Storage();
const bucket = storage.bucket(GCS_BUCKET_NAME);

const DATA_DIR_BASE = 'data-legion';

function getGuildConfigPath(guildId) {
  return `${DATA_DIR_BASE}/${guildId}/${guildId}.json`;
}

async function getLegionConfig(guildId) {
  const filePath = getGuildConfigPath(guildId);
  const file = bucket.file(filePath);
  try {
    const [exists] = await file.exists();
    if (!exists) return {};
    const [data] = await file.download();
    return JSON.parse(data.toString('utf8'));
  } catch (error) {
    console.error(`Error reading GCS file gs://${GCS_BUCKET_NAME}/${filePath}:`, error);
    throw error;
  }
}

async function saveLegionConfig(guildId, updates) {
  const filePath = getGuildConfigPath(guildId);
  const file = bucket.file(filePath);
  const currentConfig = await getLegionConfig(guildId).catch(() => ({}));
  const newConfig = { ...currentConfig, ...updates };
  await file.save(JSON.stringify(newConfig, null, 2), { contentType: 'application/json' });
  return newConfig;
}

async function setLegionAdminRole(guildId, roleId) {
  await saveLegionConfig(guildId, { legionAdminRoleId: roleId });
}
async function setQuestAdminRole(guildId, roleId) {
  await saveLegionConfig(guildId, { questAdminRoleId: roleId });
}
async function setQuestCreatorRoleIds(guildId, roleIds) {
  await saveLegionConfig(guildId, { questCreatorRoleIds: roleIds });
}
async function setChatGptAdminRole(guildId, roleId) {
  await saveLegionConfig(guildId, { chatGptAdminRoleId: roleId });
}

// --- Quest Bot Config Functions ---

async function setLogChannel(guildId, channelId) {
  await saveLegionConfig(guildId, { logChannelId: channelId });
}
async function getLogChannel(guildId) {
  const config = await getLegionConfig(guildId);
  return config.logChannelId || null;
}

async function setNotificationChannel(guildId, channelId) {
  await saveLegionConfig(guildId, { notificationChannelId: channelId });
}
async function getNotificationChannel(guildId) {
  const config = await getLegionConfig(guildId);
  return config.notificationChannelId || null;
}

async function setEmbedColor(guildId, color) {
  await saveLegionConfig(guildId, { embedColor: color });
}
async function getEmbedColor(guildId) {
  const config = await getLegionConfig(guildId);
  return config.embedColor || '#00bfff'; // Default color
}

const DEFAULT_BUTTON_ORDER = ['accept', 'cancel', 'edit', 'dm'];
async function setButtonOrder(guildId, order) {
  await saveLegionConfig(guildId, { buttonOrder: order });
}
async function getButtonOrder(guildId) {
  const config = await getLegionConfig(guildId);
  return config.buttonOrder || DEFAULT_BUTTON_ORDER;
}

async function setDashboard(guildId, messageId, channelId) {
  const dashboardData = (messageId && channelId) ? { messageId, channelId } : null;
  await saveLegionConfig(guildId, { dashboard: dashboardData });
}
async function getDashboard(guildId) {
  const config = await getLegionConfig(guildId);
  return config.dashboard || null;
}

/**
 * データが存在するすべてのギルドIDのリストを取得する
 * @returns {Promise<string[]>}
 */
async function getAllGuildIds() {
  // GCSで 'data-legion/' プレフィックス以下の "ディレクトリ" (共通プレフィックス) を一覧する
  try {
    const query = {
      prefix: `${DATA_DIR_BASE}/`,
      delimiter: '/',
    };
    const [_, __, apiResponse] = await bucket.getFiles(query);

    if (apiResponse.prefixes) {
      // apiResponse.prefixes は 'data-legion/guildId1/', 'data-legion/guildId2/' のような形式で返ってくる
      return apiResponse.prefixes.map(p => p.replace(query.prefix, '').replace('/', ''));
    }
    return [];
  } catch (error) {
    console.error('Error listing guild directories in GCS:', error);
    return []; // エラー時は空配列を返し、ボットのクラッシュを防ぐ
  }
}

module.exports = {
  getLegionConfig,
  saveLegionConfig,
  setLegionAdminRole,
  setQuestAdminRole,
  setQuestCreatorRoleIds,
  setChatGptAdminRole,
  getAllGuildIds,

  // Quest Bot Configs
  setLogChannel,
  getLogChannel,
  setNotificationChannel,
  getNotificationChannel,
  setEmbedColor,
  getEmbedColor,
  setButtonOrder,
  getButtonOrder,
  setDashboard,
  getDashboard,
};