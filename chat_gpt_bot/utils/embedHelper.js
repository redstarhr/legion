const { EmbedBuilder } = require('discord.js');

/**
 * 統一された埋め込みメッセージの色設定
 * 成功・エラー・情報・警告などの用途で使用
 */
const EmbedColors = Object.freeze({
  success: 0x57F287, // 緑（成功）
  error: 0xED4245,   // 赤（エラー）
  info: 0x5865F2,    // ブループル（情報・通知）
  warning: 0xFEE75C, // 黄色（警告など）
});

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
      iconURL: options.iconURL ?? null,
    });
  }

  if (options.timestamp !== false) {
    embed.setTimestamp();
  }

  return embed;
}

/**
 * 成功メッセージ用のEmbedを生成
 * @param {string} title
 * @param {string} description
 * @param {object} [options]
 */
function createSuccessEmbed(title, description, options) {
  return createEmbed(title, description, EmbedColors.success, options);
}

/**
 * エラーメッセージ用のEmbedを生成
 * @param {string} title
 * @param {string} description
 * @param {object} [options]
 */
function createErrorEmbed(title, description, options) {
  return createEmbed(title, description, EmbedColors.error, options);
}

/**
 * 情報表示用のEmbedを生成（管理者通知などにも）
 * @param {string} title
 * @param {string} description
 * @param {object} [options]
 */
function createInfoEmbed(title, description, options) {
  return createEmbed(title, description, EmbedColors.info, options);
}

/**
 * 警告表示用のEmbedを生成（任意）
 * @param {string} title
 * @param {string} description
 * @param {object} [options]
 */
function createWarningEmbed(title, description, options) {
  return createEmbed(title, description, EmbedColors.warning, options);
}

module.exports = {
  createSuccessEmbed,
  createErrorEmbed,
  createInfoEmbed,
  createWarningEmbed,
  createEmbed,     // 任意用途用
  EmbedColors,     // 他で再利用できるように
};
