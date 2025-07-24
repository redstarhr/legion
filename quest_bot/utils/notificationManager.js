// quest_bot/utils/notificationManager.js
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const configDataManager = require('../../configDataManager');

/**
 * A generic function to send a notification embed to the configured channel.
 * @param {import('discord.js').Client} client
 * @param {string} guildId
 * @param {object} payload - The message payload.
 * @param {EmbedBuilder[]} payload.embeds
 * @param {ActionRowBuilder[]} [payload.components]
 */
async function sendNotification(client, guildId, { embeds, components = [] }) {
    const notificationChannelId = await configDataManager.getNotificationChannel(guildId);
    if (!notificationChannelId) return;

    try {
        const channel = await client.channels.fetch(notificationChannelId);
        if (channel?.isTextBased()) {
            await channel.send({ embeds, components });
        }
    } catch (error) {
        console.error(`[NotificationManager] Failed to send notification to channel ${notificationChannelId} in guild ${guildId}:`, error);
    }
}

/**
 * Sends a notification for a new quest acceptance.
 * @param {object} context
 * @param {import('discord.js').Interaction} context.interaction
 * @param {object} context.quest - The updated quest object.
 * @param {object} context.acceptance - The new acceptance object.
 * @param {boolean} context.wasFull - Whether the quest became full with this acceptance.
 */
async function sendAcceptanceNotification({ interaction, quest, acceptance, wasFull }) {
    const questUrl = `https://discord.com/channels/${interaction.guildId}/${quest.channelId}/${quest.messageId}`;

    const embed = new EmbedBuilder()
        .setColor(0x57f287) // Green
        .setTitle('✅ クエスト受注')
        .setDescription(`${quest.title || '無題のクエスト'} に新しい受注がありました。`)
        .addFields(
            { name: '受注者', value: interaction.user.tag, inline: true },
            { name: '受注内容', value: `${acceptance.teams}組 / ${acceptance.people}人`, inline: true },
            { name: '受注チャンネル', value: `\`${interaction.channel.name}\``, inline: true }
        )
        .setTimestamp();

    if (acceptance.comment) {
        embed.addFields({ name: 'コメント', value: `>>> ${acceptance.comment}` });
    }
    if (wasFull) {
        embed.setFooter({ text: 'ℹ️ この受注により、募集が自動的に締め切られました。' });
    }

    const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setLabel('クエストへ移動').setStyle(ButtonStyle.Link).setURL(questUrl)
    );

    await sendNotification(interaction.client, interaction.guildId, { embeds: [embed], components: [row] });
}

/**
 * Sends a notification for a quest cancellation.
 * @param {object} context
 * @param {import('discord.js').Interaction} context.interaction
 * @param {object} context.quest - The updated quest object.
 * @param {boolean} context.wasFull - Whether the quest was full before this cancellation.
 */
async function sendCancellationNotification({ interaction, quest, wasFull }) {
    const questUrl = `https://discord.com/channels/${interaction.guildId}/${quest.channelId}/${quest.messageId}`;

    const embed = new EmbedBuilder()
        .setColor(0xf4900c) // Orange
        .setTitle('⚠️ 受注取消')
        .setDescription(`${quest.title || '無題のクエスト'} の受注が取り消されました。`)
        .addFields({ name: '取消者', value: interaction.user.tag, inline: true })
        .setTimestamp();

    if (wasFull) {
        embed.setFooter({ text: 'ℹ️ この取消により、募集が自動的に再開されました。' });
    }

    const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setLabel('クエストへ移動').setStyle(ButtonStyle.Link).setURL(questUrl)
    );

    await sendNotification(interaction.client, interaction.guildId, { embeds: [embed], components: [row] });
}

/**
 * Sends a notification for an expired quest.
 * @param {object} context
 * @param {import('discord.js').Client} context.client
 * @param {object} context.quest - The quest object that expired.
 */
async function sendDeadlineNotification({ client, quest }) {
    const questUrl = `https://discord.com/channels/${quest.guildId}/${quest.channelId}/${quest.messageId}`;

    const embed = new EmbedBuilder().setColor(0xf4900c).setTitle('⏰ クエスト期限切れ').setDescription(`クエスト「${quest.title || '無題のクエスト'}」が設定された期限を過ぎたため、自動的に募集を締め切りました。`).setTimestamp();

    const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setLabel('クエストへ移動').setStyle(ButtonStyle.Link).setURL(questUrl)
    );
    await sendNotification(client, quest.guildId, { embeds: [embed], components: [row] });
}

module.exports = { sendAcceptanceNotification, sendCancellationNotification, sendDeadlineNotification };