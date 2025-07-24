const { EmbedBuilder } = require('discord.js');

/**
 * Creates a standardized success embed.
 * @param {string} title The title of the embed.
 * @param {string} description The description of the embed.
 * @returns {EmbedBuilder}
 */
function createSuccessEmbed(title, description) {
  return new EmbedBuilder()
    .setTitle(title)
    .setDescription(description)
    .setColor(0x57F287); // Green
}

/**
 * Creates a standardized error embed.
 * @param {string} title The title of the embed.
 * @param {string} description The description of the embed.
 * @returns {EmbedBuilder}
 */
function createErrorEmbed(title, description) {
  return new EmbedBuilder()
    .setTitle(title)
    .setDescription(description)
    .setColor(0xED4245); // Red
}

/**
 * Creates a standardized admin/info embed.
 * @param {string} title The title of the embed.
 * @param {string} description The description of the embed.
 * @returns {EmbedBuilder}
 */
function createAdminEmbed(title, description) {
  return new EmbedBuilder()
    .setTitle(title)
    .setDescription(description)
    .setColor(0x5865F2); // Blurple
}

module.exports = {
  createSuccessEmbed,
  createErrorEmbed,
  createAdminEmbed,
};