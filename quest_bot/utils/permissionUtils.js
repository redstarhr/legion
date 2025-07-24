// utils/permissionUtils.js
const { canManageQuests } = require('../../permissionManager');

/**
 * ユーザーがクエストを管理する権限を持っているかチェックする (エイリアス)
 * @param {import('discord.js').Interaction} interaction
 * @returns {Promise<boolean>}
 */
async function hasQuestManagerPermission(interaction) {
  return await canManageQuests(interaction);
}

module.exports = { hasQuestManagerPermission };