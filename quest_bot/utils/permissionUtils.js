// utils/permissionUtils.js
const { PermissionFlagsBits } = require('discord.js');
const questDataManager = require('./questDataManager');

/**
 * ユーザーがクエストを管理する権限を持っているかチェックする
 * @param {import('discord.js').Interaction} interaction
 * @returns {Promise<boolean>}
 */
async function hasQuestManagerPermission(interaction) {
  // 1. サーバーの管理者かチェック
  if (interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
    return true;
  }

  // 2. 設定されたロールを持っているかチェック
  const managerRoleId = questDataManager.getQuestManagerRole(interaction.guildId);
  if (managerRoleId && interaction.member.roles.cache.has(managerRoleId)) {
    return true;
  }

  return false;
}

module.exports = { hasQuestManagerPermission };