// e:/共有フォルダ/legion/utils/logger.js
const { EmbedBuilder } = require('discord.js');
const { getLogChannel } = require('../manager/configDataManager');

/**
 * Logs an action to the configured log channel for a guild.
 * @param {object} context
 * @param {import('discord.js').Client} context.client
 * @param {string} context.guildId
 * @param {import('discord.js').User} [context.user] - The user who performed the action.
 * @param {object} logData
 * @param {string} logData.title - The title of the log embed.
 * @param {string} [logData.description] - The description of the log embed.
 * @param {string} [logData.color] - The color of the embed.
 * @param {object} [logData.details] - An object of key-value pairs to display as fields.
 */
async function logAction({ client, guildId, user }, logData) {
    const logChannelId = await getLogChannel(guildId);
    if (!logChannelId) return;

    try {
        const channel = await client.channels.fetch(logChannelId);
        if (!channel || !channel.isTextBased()) return;

        const embed = new EmbedBuilder()
            .setTitle(logData.title)
            .setColor(logData.color || '#5865F2')
            .setTimestamp();

        if (logData.description) {
            embed.setDescription(logData.description);
        }

        if (user) {
            embed.setFooter({ text: `実行者: ${user.tag}`, iconURL: user.displayAvatarURL() });
        }

        if (logData.details) {
            const fields = Object.entries(logData.details).map(([name, value]) => ({ name, value: String(value), inline: true }));
            embed.addFields(fields);
        }

        await channel.send({ embeds: [embed] });
    } catch (error) {
        console.error(`[Logger] Failed to send log to channel ${logChannelId} in guild ${guildId}:`, error);
    }
}

module.exports = { logAction };