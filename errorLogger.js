const { EmbedBuilder } = require('discord.js');
const { getLogChannel } = require('./configDataManager');

/**
 * Logs an error to both the console and a designated Discord log channel.
 * @param {object} context - The context in which the error occurred.
 * @param {Error} context.error - The caught error object.
 * @param {import('discord.js').Client} [context.client] - The Discord client instance.
 * @param {string} [context.guildId] - The ID of the guild where the error occurred.
 * @param {import('discord.js').Interaction} [context.interaction] - The interaction that caused the error.
 * @param {string} [context.customContext] - Any additional custom context message.
 */
async function logError({ error, client, guildId, interaction, customContext }) {
    const timestamp = new Date().toISOString();
    const user = interaction?.user;
    const guild = interaction?.guild;

    // 1. Log detailed error to console
    console.error(`[ERROR] [${timestamp}] ${customContext || 'An unhandled error occurred'}:`, error);

    // 2. Attempt to log to Discord channel
    const logGuildId = guildId || guild?.id;
    if (!client || !logGuildId) {
        console.error('[ErrorLogger] Cannot log to Discord without client and guildId.');
        return;
    }

    const logChannelId = await getLogChannel(logGuildId);
    if (!logChannelId) return;

    try {
        const logChannel = await client.channels.fetch(logChannelId);
        if (!logChannel || !logChannel.isTextBased()) return;

        const errorEmbed = new EmbedBuilder()
            .setColor(0xFF0000) // Red
            .setTitle('❌ エラー発生')
            .setTimestamp();

        if (customContext) errorEmbed.addFields({ name: 'コンテキスト', value: customContext });
        if (user) errorEmbed.addFields({ name: 'ユーザー', value: `${user.tag} (${user.id})`, inline: true });
        if (guild) errorEmbed.addFields({ name: 'サーバー', value: `${guild.name} (${guild.id})`, inline: true });
        if (interaction?.customId) errorEmbed.addFields({ name: 'インタラクションID', value: `\`${interaction.customId}\``, inline: true });

        // Add error stack, respecting Discord's character limits
        const errorMessage = error.stack || error.message;
        errorEmbed.setDescription(`\`\`\`\n${errorMessage.substring(0, 4000)}\n\`\`\``);

        await logChannel.send({ embeds: [errorEmbed] });
    } catch (discordError) {
        console.error(`[ErrorLogger] CRITICAL: Failed to send error log to Discord channel ${logChannelId}.`, discordError);
    }
}

module.exports = { logError };