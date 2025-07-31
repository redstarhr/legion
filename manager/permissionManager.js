'use strict';

const { PermissionsBitField } = require('discord.js');
const { getLegionConfig } = require('./configDataManager');

/**
 * コマンドを実行したメンバーが管理者権限を持っているか確認します。
 * @param {import('discord.js').Interaction} interaction - Discordのインタラクションオブジェクト。
 * @returns {boolean} 管理者権限を持っている場合はtrue、そうでない場合はfalse。
 */
function isAdmin(interaction) {
  // DM内での実行など、メンバー情報が取得できない場合はfalseを返す
  if (!interaction.member || !interaction.member.permissions) {
    return false;
  }

  // メンバーが管理者権限を持っているか確認
  return interaction.member.permissions.has(PermissionsBitField.Flags.Administrator);
}

/**
 * メンバーがChatGPT管理者かどうかを確認します。
 * サーバー管理者、または設定されたChatGPT管理者ロールを持っている場合にtrueを返します。
 * @param {import('discord.js').Interaction} interaction
 * @returns {Promise<boolean>}
 */
async function isChatGptAdmin(interaction) {
  if (!interaction.inGuild()) return false; // ギルド外では常にfalse

  // サーバー管理者なら常にtrue
  if (isAdmin(interaction)) {
    return true;
  }

  const config = await getLegionConfig(interaction.guildId);
  const adminRoleId = config.chatGptAdminRoleId;

  if (!adminRoleId) {
    // 管理者ロールが設定されていなければ、サーバー管理者のみが権限を持つ
    return false;
  }

  // メンバーがロールを持っているか確認
  return interaction.member.roles.cache.has(adminRoleId);
}

module.exports = {
  isAdmin,
  isChatGptAdmin,
};