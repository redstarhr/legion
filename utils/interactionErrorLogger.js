const { MessageFlags } = require('discord.js');
const { logError } = require('./errorLogger');

/**
 * A standardized error handler for Discord.js interactions.
 * It logs the error with a context message and sends a generic error reply to the user.
 * @param {object} options
 * @param {import('discord.js').Interaction} options.interaction - The interaction that failed.
 * @param {Error} options.error - The caught error object.
 * @param {string} options.context - A brief message describing where the error occurred (for logging).
 */
async function handleInteractionError({ interaction, error, context }) {
    // Use the centralized logger
    await logError({
        error,
        interaction,
        customContext: `Interaction failed: ${context}`,
    });

    // 10062: Unknown interaction. This usually means the interaction timed out.
    // We cannot reply to it, so we just log the error and exit.
    if (error.code === 10062) {
        console.warn(`[handleInteractionError] Could not reply to interaction (ID: ${interaction.id}) as it is unknown or has expired.`);
        return;
    }

    const errorMessage = {
        content: '❌ 処理中にエラーが発生しました。しばらくしてからもう一度お試しください。',
        flags: MessageFlags.Ephemeral,
        components: [], // Remove any components to prevent further interaction
    };

    try {
        if (interaction.replied || interaction.deferred) {
            await interaction.followUp(errorMessage);
        } else {
            await interaction.reply(errorMessage);
        }
    } catch (replyError) {
        console.error(`[ErrorLogger] CRITICAL: Failed to send error reply for interaction [${interaction.id}]:`, replyError);
    }
}

module.exports = { handleInteractionError };