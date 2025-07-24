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
async function setChatGptAdminRole(guildId, roleId) {
  await saveLegionConfig(guildId, { chatGptAdminRoleId: roleId });
}

module.exports = {
  getLegionConfig,
  saveLegionConfig,
  setLegionAdminRole,
  setQuestAdminRole,
  setChatGptAdminRole,
};