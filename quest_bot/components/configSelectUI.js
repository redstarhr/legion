// quest_bot/components/configSelectUI.js
const { ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags } = require('discord.js');

/**
 * Creates a standardized UI for configuration selection with a select menu and a remove button.
 * @param {import('discord.js').Interaction} interaction The interaction to reply to.
 * @param {object} options
 * @param {import('discord.js').AnySelectMenuBuilder} options.selectMenu The select menu component.
 * @param {string} options.removeButtonCustomId The custom ID for the remove button.
 * @param {string} options.content The content of the reply message.
 */
async function replyWithConfigSelect(interaction, { selectMenu, removeButtonCustomId, content }) {
    const removeButton = new ButtonBuilder()
        .setCustomId(removeButtonCustomId)
        .setLabel('設定を解除')
        .setStyle(ButtonStyle.Danger);

    const rowWithSelect = new ActionRowBuilder().addComponents(selectMenu);
    const rowWithButton = new ActionRowBuilder().addComponents(removeButton);

    await interaction.reply({
        content,
        components: [rowWithSelect, rowWithButton],
        flags: MessageFlags.Ephemeral,
    });
}

module.exports = { replyWithConfigSelect };