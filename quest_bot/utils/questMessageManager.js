// quest_bot/utils/questMessageManager.js

const { createQuestEmbed } = require('./embeds');
const { createQuestActionRows } = require('../components/questActionButtons');

/**
 * Updates the original quest message with the latest quest data.
 * @param {import('discord.js').Client} client The Discord client instance.
 * @param {object} quest The quest object to update the message for.
 */
async function updateQuestMessage(client, quest) {
    if (!quest || !quest.channelId || !quest.messageId) {
        console.warn(`[MessageUpdate] Invalid quest object provided for update. Missing channelId or messageId. Quest ID: ${quest?.id}`);
        return;
    }

    try {
        const questChannel = await client.channels.fetch(quest.channelId);
        if (!questChannel || !questChannel.isTextBased()) {
            console.error(`[MessageUpdate] Channel ${quest.channelId} not found or not a text channel for quest ${quest.id}.`);
            return;
        }
        const questMessage = await questChannel.messages.fetch(quest.messageId);
        const newEmbed = await createQuestEmbed(quest);
        const newButtons = await createQuestActionRows(quest);
        await questMessage.edit({ embeds: [newEmbed], components: newButtons });
    } catch (e) {
        console.error(`[MessageUpdate] Failed to update original quest message ${quest.messageId} for quest ${quest.id}:`, e);
    }
}

module.exports = { updateQuestMessage };