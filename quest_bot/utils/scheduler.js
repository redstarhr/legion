// e:/共有フォルダ/legion/quest_bot/utils/scheduler.js
const cron = require('node-cron');
const { getAllGuildIds, getDashboard, setDashboard } = require('../../manager/configDataManager');
const { createQuestDashboardPanel } = require('../components/dashboardPanel');
const { logError } = require('../../utils/errorLogger');

/**
 * Initializes all scheduled tasks for the bot.
 * @param {import('discord.js').Client} client
 */
function initializeScheduler(client) {
    console.log('🕒 スケジューラを初期化中...');

    // 毎日午前6時 (JST) に実行
    // Cron format: '分 時 日 月 曜日'
    cron.schedule('0 6 * * *', async () => {
        console.log('⏰ 毎日のクエスト掲示板更新タスクを開始します...');
        try {
            const guildIds = await getAllGuildIds();
            for (const guildId of guildIds) {
                await refreshQuestDashboard(client, guildId);
            }
        } catch (error) {
            // タスク全体の包括的なエラーハンドリング
            await logError({ client, error, context: 'Daily Dashboard Refresh Task' });
        }
        console.log('✅ 毎日のクエスト掲示板更新タスクが完了しました。');
    }, {
        scheduled: true,
        timezone: "Asia/Tokyo"
    });

    console.log('✅ スケジューラが正常に初期化されました。タスクは毎日午前6時に実行されます。');
}

/**
 * Refreshes the quest dashboard for a specific guild.
 * @param {import('discord.js').Client} client
 * @param {string} guildId
 */
async function refreshQuestDashboard(client, guildId) {
    const dashboardConfig = await getDashboard(guildId);
    if (!dashboardConfig || !dashboardConfig.channelId) {
        return; // ダッシュボードが設定されていなければスキップ
    }

    try {
        const channel = await client.channels.fetch(dashboardConfig.channelId).catch(() => null);
        if (!channel || !channel.isTextBased()) {
            console.warn(`[Scheduler] Dashboard channel ${dashboardConfig.channelId} not found for guild ${guildId}.`);
            return;
        }

        // 1. 古いダッシュボードメッセージを削除
        if (dashboardConfig.messageId) {
            await channel.messages.delete(dashboardConfig.messageId).catch(err => {
                // メッセージが手動で削除されていた場合のエラーは無視
                if (err.code !== 10008) {
                    console.warn(`[Scheduler] Could not delete old dashboard message ${dashboardConfig.messageId} in guild ${guildId}:`, err.message);
                }
            });
        }

        // 2. 新しいダッシュボードを投稿
        const newDashboardPanel = await createQuestDashboardPanel(channel.guild);
        const newMessage = await channel.send(newDashboardPanel);

        // 3. 新しいメッセージIDで設定を更新
        await setDashboard(guildId, newMessage.id, channel.id);
        console.log(`[Scheduler] Successfully refreshed quest dashboard for guild ${guildId} in channel ${channel.id}.`);

    } catch (error) {
        await logError({ client, error, context: `Dashboard Refresh for Guild ${guildId}`, guildId });
    }
}

module.exports = { initializeScheduler };