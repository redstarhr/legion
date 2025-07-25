// e:/共有フォルダ/legion/quest_bot/utils/scheduler.js
const cron = require('node-cron');
const { EmbedBuilder } = require('discord.js');
const questDataManager = require('../../manager/questDataManager');
const configDataManager = require('../../manager/configDataManager');

/**
 * Sends a "start of day" message to configured notification channels.
 * @param {import('discord.js').Client} client
 */
async function sendStartOfDayMessage(client) {
    console.log('[Scheduler] Running start-of-day task...');
    const guilds = client.guilds.cache;
    for (const guild of guilds.values()) {
        const channelId = await configDataManager.getNotificationChannel(guild.id);
        if (channelId) {
            const channel = await client.channels.fetch(channelId).catch(() => null);
            if (channel && channel.isTextBased()) {
                const embed = new EmbedBuilder()
                    .setTitle('☀️ 活動開始')
                    .setDescription('今日の活動を開始します！\nクエスト掲示板を確認して、参加できるクエストを探しましょう。')
                    .setColor('#f1c40f')
                    .setTimestamp();
                await channel.send({ embeds: [embed] });
            }
        }
    }
}

/**
 * Sends an "end of day" message to configured notification channels.
 * @param {import('discord.js').Client} client
 */
async function sendEndOfDayMessage(client) {
    console.log('[Scheduler] Running end-of-day task...');
    const guilds = client.guilds.cache;
    for (const guild of guilds.values()) {
        const channelId = await configDataManager.getNotificationChannel(guild.id);
        if (channelId) {
            const channel = await client.channels.fetch(channelId).catch(() => null);
            if (channel && channel.isTextBased()) {
                const embed = new EmbedBuilder()
                    .setTitle('🌙 活動終了')
                    .setDescription('今日の活動は終了です。お疲れ様でした！')
                    .setColor('#34495e')
                    .setTimestamp();
                await channel.send({ embeds: [embed] });
            }
        }
    }
}

/**
 * Initializes the cron jobs for scheduled tasks.
 * @param {import('discord.js').Client} client
 */
function initializeScheduler(client) {
    // JST is UTC+9. Cron uses server time, which should be set to JST.
    cron.schedule('0 15 * * *', () => sendStartOfDayMessage(client), { scheduled: true, timezone: "Asia/Tokyo" });
    console.log('✅ Start-of-day task scheduled for 3:00 PM JST.');

    cron.schedule('0 6 * * *', () => sendEndOfDayMessage(client), { scheduled: true, timezone: "Asia/Tokyo" });
    console.log('✅ End-of-day task scheduled for 6:00 AM JST.');
}

module.exports = { initializeScheduler };