const { EmbedBuilder } = require('discord.js');
const { getLogChannel } = require('../manager/configDataManager');

const DEFAULT_EMBED_COLOR = '#5865F2';

/**
 * Logs an action to the configured log channel for a guild.
 * @param {object} context
 * @param {import('discord.js').Client} context.client
 * @param {string} context.guildId
 * @param {import('discord.js').User} [context.user] - The user who performed the action.
 * @param {object} logData
 * @param {string} logData.title - The title of the log embed.
 * @param {string} [logData.description] - The description of the log embed.
 * @param {string} [logData.color] - The hex color of the embed.
 * @param {object} [logData.details] - An object of key-value pairs to display as fields.
 */
async function logAction({ client, guildId, user }, logData) {
    const logChannelId = await getLogChannel(guildId);
    if (!logChannelId) {
        console.warn(`[Logger] No log channel configured for guild ${guildId}.`);
        return;
    }

    try {
        const channel = await client.channels.fetch(logChannelId);
        if (!channel || !channel.isTextBased()) {
            console.warn(`[Logger] Configured log channel (${logChannelId}) is not text-based in guild ${guildId}.`);
            return;
        }

        const embed = new EmbedBuilder()
            .setTitle(logData.title)
            .setColor(logData.color || DEFAULT_EMBED_COLOR)
            .setTimestamp();

        if (logData.description) {
            embed.setDescription(logData.description);
        }

        if (user) {
            embed.setFooter({
                text: `実行者: ${user.tag}`,
                iconURL: user.displayAvatarURL(),
            });
        }

        if (logData.details && Object.keys(logData.details).length > 0) {
            const fields = Object.entries(logData.details).map(([name, value]) => ({
                name,
                value: String(value),
                inline: true,
            }));
            embed.addFields(fields);
        }

        await channel.send({ embeds: [embed] });
        // Optional: 成功ログ（開発中のデバッグ用）
        // console.log(`[Logger] Log sent to #${channel.name} (${logChannelId}) in guild ${guildId}.`);
    } catch (error) {
        console.error(`[Logger] Failed to send log to channel ${logChannelId} in guild ${guildId}:`, error);
    }
}

module.exports = { logAction };
