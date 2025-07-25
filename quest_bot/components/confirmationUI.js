// e:/共有フォルダ/legion/quest_bot/components/confirmationUI.js
const { ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags } = require('discord.js');

/**
 * Replies to an interaction with a confirmation message and two buttons (Confirm/Cancel).
 * @param {import('discord.js').Interaction} interaction The interaction to reply to.
 * @param {object} options
 * @param {string} options.content The message content.
 * @param {string} options.confirmCustomId The custom ID for the confirmation button.
 * @param {string} options.confirmLabel The label for the confirmation button.
 * @param {string} options.cancelCustomId The custom ID for the cancellation button.
 */
async function replyWithConfirmation(interaction, { content, confirmCustomId, confirmLabel, cancelCustomId }) {
    const row = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder().setCustomId(confirmCustomId).setLabel(confirmLabel).setStyle(ButtonStyle.Danger),
            new ButtonBuilder().setCustomId(cancelCustomId).setLabel('キャンセル').setStyle(ButtonStyle.Secondary)
        );

    await interaction.reply({
        content,
        components: [row],
        flags: MessageFlags.Ephemeral,
    });
}

module.exports = { replyWithConfirmation };