const { EmbedBuilder } = require('discord.js');

/**
 * 統一された埋め込みメッセージの色設定
 */
const EmbedColors = {
  success: 0x57F287, // 緑（成功）
  error: 0xED4245,   // 赤（エラー）
  info: 0x5865F2,    // ブループル（管理者・情報）
  warning: 0xFEE75C, // 黄色（警告など。必要なら）
};

/**
 * Embedを生成する共通関数
 * @param {string} title - タイトル
 * @param {string} description - 説明文
 * @param {number} color - 埋め込みの色 (16進数)
 * @param {object} [options]
 * @param {string} [options.footerText] - フッター文字列
 * @param {string} [options.iconURL] - フッター用アイコンURL
 * @param {boolean} [options.timestamp=true] - タイムスタンプ追加有無
 * @returns {EmbedBuilder}
 */
function createEmbed(title, description, color, options = {}) {
  const embed = new EmbedBuilder()
    .setTitle(title)
    .setDescription(description)
    .setColor(color);

  if (options.footerText) {
    embed.setFooter({
      text: options.footerText,
      iconURL: options.iconURL || undefined,
    });
  }

  if (options.timestamp !== false) {
    embed.setTimestamp();
  }

  return embed;
}

/**
 * 成功メッセージ用のEmbedを生成
 */
function createSuccessEmbed(title, description, options) {
  return createEmbed(title, description, EmbedColors.success, options);
}

/**
 * エラーメッセージ用のEmbedを生成
 */
function createErrorEmbed(title, description, options) {
  return createEmbed(title, description, EmbedColors.error, options);
}

/**
 * 管理者/情報メッセージ用のEmbedを生成
 */
function createAdminEmbed(title, description, options) {
  return createEmbed(title, description, EmbedColors.info, options);
}

/**
 * 警告Embed（必要であれば）
 */
function createWarningEmbed(title, description, options) {
  return createEmbed(title, description, EmbedColors.warning, options);
}

module.exports = {
  createSuccessEmbed,
  createErrorEmbed,
  createAdminEmbed,
  createWarningEmbed,
  createEmbed,       // 任意で自由に作る用
  EmbedColors,       // 他でも使えるように export
};
