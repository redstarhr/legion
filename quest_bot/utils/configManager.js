// quest_bot/utils/configManager.js
const path = require('path');
const { ensureJsonFile, readJson, writeJson } = require('./gcsFileHelper');

const DEFAULT_QUEST_CONFIG = {
  logChannelId: null,
  notificationChannelId: null,
  embedColor: '#00bfff',
  buttonOrder: ['accept', 'cancel', 'edit', 'dm'],
  dashboard: null, // { messageId: string, channelId: string }
};

function getQuestConfigPath(guildId) {
  return `data-legion/quest_bot/${guildId}/quest_config.json`;
}

async function getQuestConfig(guildId) {
  const configPath = getQuestConfigPath(guildId);
  return await ensureJsonFile(configPath, DEFAULT_QUEST_CONFIG);
}

async function saveQuestConfig(guildId, updates) {
  const configPath = getQuestConfigPath(guildId);
  const currentConfig = await getQuestConfig(guildId);
  const merged = { ...currentConfig, ...updates };
  await writeJson(configPath, merged);
  return merged;
}

async function getLogChannel(guildId) {
  const config = await getQuestConfig(guildId);
  return config.logChannelId || null;
}

async function setLogChannel(guildId, channelId) {
  return await saveQuestConfig(guildId, { logChannelId: channelId });
}

async function getNotificationChannel(guildId) {
  const config = await getQuestConfig(guildId);
  return config.notificationChannelId || null;
}

async function setNotificationChannel(guildId, channelId) {
  return await saveQuestConfig(guildId, { notificationChannelId: channelId });
}

async function getEmbedColor(guildId) {
  const config = await getQuestConfig(guildId);
  return config.embedColor || '#00bfff';
}

async function setEmbedColor(guildId, color) {
  return await saveQuestConfig(guildId, { embedColor: color });
}

async function getButtonOrder(guildId) {
  const config = await getQuestConfig(guildId);
  return config.buttonOrder || DEFAULT_QUEST_CONFIG.buttonOrder;
}

async function setButtonOrder(guildId, order) {
  return await saveQuestConfig(guildId, { buttonOrder: order });
}

async function getDashboard(guildId) {
  const config = await getQuestConfig(guildId);
  return config.dashboard || null;
}

async function setDashboard(guildId, messageId, channelId) {
  const dashboardData = (messageId && channelId) ? { messageId, channelId } : null;
  return await saveQuestConfig(guildId, { dashboard: dashboardData });
}

module.exports = {
  getQuestConfig,
  saveQuestConfig,
  getLogChannel,
  setLogChannel,
  getNotificationChannel,
  setNotificationChannel,
  getEmbedColor,
  setEmbedColor,
  getButtonOrder,
  setButtonOrder,
  getDashboard,
  setDashboard,
};
