// e:/共有フォルダ/legion/utils/errorLogger.js
const { EmbedBuilder } = require('discord.js');
const { getLogChannel } = require('../manager/configDataManager');

/**
 * Logs an error to the console and to a configured Discord channel.
 * @param {object} options
 * @param {import('discord.js').Client} options.client The Discord client instance.
 * @param {Error} options.error The error object.
 * @param {string} [options.context='Unspecified Context'] A string describing the context of the error.
 * @param {string | null} [options.guildId=null] The ID of the guild where the error occurred, if applicable.
 */
async function logError({ client, error, context = 'Unspecified Context', guildId = null }) {
  // 1. Log to console for immediate debugging
  console.error(`[ERROR][${context}]`, error);

  // If no guild context is provided, we can't log to a specific channel.
  if (!guildId) return;

  try {
    // 2. Get the configured log channel for the guild
    const logChannelId = await getLogChannel(guildId);
    if (!logChannelId) return; // No log channel configured.

    const channel = await client.channels.fetch(logChannelId).catch(() => null);
    if (!channel || !channel.isTextBased()) {
      console.error(`[Logger] Could not find or access the configured log channel (${logChannelId}) for guild ${guildId}.`);
      return;
    }

    // 3. Create a detailed embed
    const embed = new EmbedBuilder()
      .setTitle(`❌ エラー発生`)
      .setColor(0xED4245) // Red
      .setTimestamp()
      .addFields(
        { name: 'コンテキスト', value: `\`\`\`${context}\`\`\`` },
        { name: 'エラーメッセージ', value: `\`\`\`${error.message}\`\`\`` },
        { name: 'スタックトレース', value: '```' + (error.stack || 'Stack not available').substring(0, 1000) + '```' }
      );

    // 4. Send the embed to the channel
    await channel.send({ embeds: [embed] });
  } catch (loggingError) {
    console.error(`[FATAL] Failed to send error log to Discord.`, loggingError);
  }
}

module.exports = { logError };