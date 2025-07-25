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

// --- ChatGPT Bot Config Functions ---

const CHAT_GPT_CONFIG_KEY = 'chatGptConfig';

/**
 * Retrieves the ChatGPT-specific configuration for a guild.
 * @param {string} guildId The ID of the guild.
 * @returns {Promise<object>} The ChatGPT configuration object.
 */
async function getChatGPTConfig(guildId) {
    const fullConfig = await getLegionConfig(guildId);
    return fullConfig[CHAT_GPT_CONFIG_KEY] || {};
}

/**
 * Updates and saves the ChatGPT-specific configuration for a guild.
 * @param {string} guildId The ID of the guild.
 * @param {object} updates The partial configuration updates. Values of `null` or `undefined` will be removed.
 * @returns {Promise<object>} The newly updated ChatGPT configuration object.
 */
async function setChatGPTConfig(guildId, updates) {
    const currentGptConfig = await getChatGPTConfig(guildId);
    const newGptConfig = { ...currentGptConfig, ...updates };

    // Clean up keys that are set to null or undefined, which signals a reset to default.
    for (const key in newGptConfig) {
        if (newGptConfig[key] === null || newGptConfig[key] === undefined) {
            delete newGptConfig[key];
        }
    }

    await saveLegionConfig(guildId, { [CHAT_GPT_CONFIG_KEY]: newGptConfig });
    return newGptConfig;
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


module.exports = {
  getLegionConfig,
  saveLegionConfig,
  setLegionAdminRole,
  setQuestAdminRole,
  setQuestCreatorRoleIds,
  setChatGptAdminRole,

  // ChatGPT Bot Configs
  getChatGPTConfig,
  setChatGPTConfig,

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