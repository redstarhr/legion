'use strict';

const { Storage } = require('@google-cloud/storage');

const BUCKET_NAME = process.env.GCS_BUCKET_NAME;
if (!BUCKET_NAME) {
  // This is a warning, not an error, to allow local development without GCS.
  console.warn('⚠️ GCS_BUCKET_NAME is not set. Configuration will not be persistent across restarts.');
}

const storage = BUCKET_NAME ? new Storage() : null;
const bucket = storage ? storage.bucket(BUCKET_NAME) : null;

// In-memory cache for guild configurations to reduce GCS reads.
const configCache = new Map();

const DATA_DIR_BASE = 'data-legion/guilds'; // questDataManagerとパスを統一

/**
 * Gets the file path for a guild's configuration within the GCS bucket.
 * @param {string} guildId The ID of the guild.
 * @returns {string} The GCS file path.
 */
function getConfigPath(guildId) {
  // Stores all config for a guild in a single JSON file.
  return `${DATA_DIR_BASE}/${guildId}/config.json`;
}

/**
 * Retrieves the configuration for a specific guild.
 * It first checks an in-memory cache, then falls back to GCS.
 * @param {string} guildId The ID of the guild.
 * @returns {Promise<object>} The guild's configuration object. Returns an empty object if not found.
 */
async function getLegionConfig(guildId) {
  if (configCache.has(guildId)) {
    return configCache.get(guildId);
  }

  if (!bucket) {
    // Return a default, non-persistent config if GCS is not available.
    return {};
  }

  const filePath = getConfigPath(guildId);
  const file = bucket.file(filePath);

  try {
    const [data] = await file.download();
    const config = JSON.parse(data.toString());
    configCache.set(guildId, config);
    return config;
  } catch (error) {
    if (error.code === 404) {
      // File not found, which is normal for a new guild.
      // Cache an empty object to avoid repeated GCS calls for this guild.
      configCache.set(guildId, {});
      return {};
    }
    console.error(`❌ Error fetching config for guild ${guildId} from GCS:`, error);
    // In case of other errors, return a default config to prevent crashes.
    return {};
  }
}

/**
 * Saves/updates the configuration for a specific guild to the cache and GCS.
 * @param {string} guildId The ID of the guild.
 * @param {object} updates An object containing the configuration keys and values to update.
 * @returns {Promise<object>} The newly saved, complete configuration object.
 */
async function saveLegionConfig(guildId, updates) {
  const currentConfig = await getLegionConfig(guildId);
  const newConfig = { ...currentConfig, ...updates };

  // Update the in-memory cache immediately for responsiveness.
  configCache.set(guildId, newConfig);

  if (!bucket) {
    console.warn(`⚠️ GCS not configured. Config for guild ${guildId} is only saved in memory.`);
    return newConfig;
  }

  const filePath = getConfigPath(guildId);
  const file = bucket.file(filePath);

  try {
    await file.save(JSON.stringify(newConfig, null, 2), {
      contentType: 'application/json',
    });
  } catch (error) {
    console.error(`❌ Error saving config for guild ${guildId} to GCS:`, error);
  }

  return newConfig;
}

const setLegionAdminRole = (guildId, roleId) => saveLegionConfig(guildId, { legionAdminRoleId: roleId });
const setChatGptAdminRole = (guildId, roleId) => saveLegionConfig(guildId, { chatGptAdminRoleId: roleId });

module.exports = {
  getLegionConfig,
  saveLegionConfig,
  setLegionAdminRole,
  setChatGptAdminRole,
};