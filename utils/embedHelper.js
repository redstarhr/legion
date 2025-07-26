// e:/共有フォルダ/legion/utils/embedHelper.js
const { EmbedBuilder } = require('discord.js');

const EmbedColors = Object.freeze({
  success: 0x57F287,
  error: 0xED4245,
  info: 0x5865F2,
  warning: 0xFEE75C,
  admin: 0x71368A, // A distinct color for admin panels
});

/**
 * Creates a base embed.
 * @param {string} title
 * @param {string} description
 * @param {number} color
 * @param {object} [options]
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
 * Creates a success-themed embed.
 * @param {string} title
 * @param {string} description
 * @param {object} [options]
 */
function createSuccessEmbed(title, description, options) {
  return createEmbed(title, description, EmbedColors.success
    , options);
}

/**
 * Creates an error-themed embed.
 * @param {string} title
 * @param {string} description
 * @param {object} [options]
 */
function createErrorEmbed(title, description, options) {
  return createEmbed(title, description, EmbedColors.error, options);
}

/**
 * Creates an info-themed embed.
 * @param {string} title
 * @param {string} description
 * @param {object} [options]
 */
function createInfoEmbed(title, description, options) {
  return createEmbed(title, description, EmbedColors.info, options);
}

/**
 * Creates an admin-themed embed.
 * @param {string} title
 * @param {string} description
 * @param {object} [options]
 */
function createAdminEmbed(title, description, options) {
    return createEmbed(title, description, EmbedColors.admin, options);
}

module.exports = {
  createSuccessEmbed,
  createErrorEmbed,
  createInfoEmbed,
  createAdminEmbed,
  createEmbed,
  EmbedColors,
};
    , options);
}

/**
 * Creates an error-themed embed.
 * @param {string} title
 * @param {string} description
 * @param {object} [options]
 */
function createErrorEmbed(title, description, options) {
  return createEmbed(title, description, EmbedColors.error, options);
}

/**
 * Creates an info-themed embed.
 * @param {string} title
 * @param {string} description
 * @param {object} [options]
 */
function createInfoEmbed(title, description, options) {
  return createEmbed(title, description, EmbedColors.info, options);
}

/**
 * Creates an admin-themed embed.
 * @param {string} title
 * @param {string} description
 * @param {object} [options]
 */
function createAdminEmbed(title, description, options) {
    return createEmbed(title, description, EmbedColors.admin, options);
}

module.exports = {
  createSuccessEmbed,
  createErrorEmbed,
  createInfoEmbed,
  createAdminEmbed,
  createEmbed,
  EmbedColors,
};