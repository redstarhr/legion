// quest_bot/components/confirmationUI.js
const { ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags } = require('discord.js');

/**
 * Replies to an interaction with a standardized confirmation prompt (Yes/No buttons).
 * @param {import('discord.js').Interaction} interaction The interaction to reply to.
 * @param {object} options
 * @param {string} options.content The confirmation message content.
 * @param {string} options.confirmCustomId The custom ID for the confirmation button.
 * @param {string} options.confirmLabel The label for the confirmation button.
 * @param {ButtonStyle} [options.confirmStyle=ButtonStyle.Danger] The style for the confirmation button.
 * @param {string} options.cancelCustomId The custom ID for the cancellation button.
 */
async function replyWithConfirmation(interaction, { content, confirmCustomId, confirmLabel, confirmStyle = ButtonStyle.Danger, cancelCustomId }) {
    const confirmationRow = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder().setCustomId(confirmCustomId).setLabel(confirmLabel).setStyle(confirmStyle),
            new ButtonBuilder().setCustomId(cancelCustomId).setLabel('いいえ').setStyle(ButtonStyle.Secondary)
        );

    await interaction.reply({
        content,
        components: [confirmationRow],
        flags: MessageFlags.Ephemeral,
    });
}

module.exports = { replyWithConfirmation };