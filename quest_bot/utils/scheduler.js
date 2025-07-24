// quest_bot/utils/scheduler.js
const cron = require('node-cron');
const { EmbedBuilder } = require('discord.js');
const questDataManager = require('./questDataManager');
const configDataManager = require('../../configDataManager');

/**
 * processEndOfDayから返されたサマリーをDiscord Embedに整形する
 * @param {object} summary - processEndOfDayから返されたサマリーオブジェクト
 * @param {string} embedColor - Embedに使用する16進数カラーコード
 * @returns {EmbedBuilder}
 */
function createSummaryEmbed(summary, embedColor) {
  const summaryEmbed = new EmbedBuilder()
    .setColor(embedColor)
    .setTitle(`🌅 定期実行: 1日の活動報告 (${new Date().toLocaleDateString('ja-JP', { timeZone: 'Asia/Tokyo' })})`)
    .setDescription('本日のクエスト活動の自動集計結果です。')
    .setTimestamp();

  const { completedQuests, failedParticipants } = summary;

  if (completedQuests.length > 0) {
    summaryEmbed.addFields({
      name: `✅ 達成したクエスト (${completedQuests.length}件)`,
      value: completedQuests.map((q) => `・${q.name}`).join('\n').slice(0, 1024),
    });
  }

  if (failedParticipants.length > 0) {
    const failedText = failedParticipants
      .map((p) => `・<@${p.userId}> (${p.questName})`)
      .join('\n');
    summaryEmbed.addFields({
      name: `❌ 失敗した参加者 (${failedParticipants.length}名)`,
      value: failedText.slice(0, 1024),
    });
  }
  return summaryEmbed;
}

/**
 * 全てのギルドに対して1日の始まりのタスクを実行する
 * @param {import('discord.js').Client} client
 */
async function runStartOfDayTasks(client) {
  console.log('[Scheduler] Running daily start-of-day process...');
  const guildIds = await questDataManager.getAllGuildIds();

  for (const guildId of guildIds) {
    try {
      const guild = await client.guilds.fetch(guildId).catch(() => null);
      if (!guild) {
        console.warn(`[Scheduler] Could not fetch guild ${guildId} for start-of-day. Skipping.`);
        continue;
      }

      const logChannelId = await configDataManager.getLogChannel(guildId);
      if (logChannelId) {
        const logChannel = await guild.channels.fetch(logChannelId).catch(() => null);
        if (logChannel && logChannel.isTextBased()) {
          const embedColor = await configDataManager.getEmbedColor(guildId);
          const startEmbed = new EmbedBuilder()
            .setColor(embedColor)
            .setTitle('☀️ 1日の始まり')
            .setDescription('今日のクエスト活動を開始します！\nクエスト掲示板を確認して、参加できるクエストを探しましょう。')
            .setTimestamp();
          await logChannel.send({ embeds: [startEmbed] });
          console.log(`[Scheduler] Sent start-of-day message to log channel in ${guild.name}.`);
        }
      }
    } catch (error) {
      console.error(`[Scheduler] Unhandled error during start-of-day task for guild ${guildId}:`, error);
    }
  }
  console.log('[Scheduler] Daily start-of-day process finished.');
}

/**
 * 全てのギルドに対して日次処理を実行する
 * @param {import('discord.js').Client} client
 */
async function runDailyTasks(client) {
  console.log('[Scheduler] Running daily end-of-day process...');
  const guildIds = await questDataManager.getAllGuildIds();

  for (const guildId of guildIds) {
    try {
      const guild = await client.guilds.fetch(guildId).catch(() => null);
      if (!guild) {
        console.warn(`[Scheduler] Could not fetch guild ${guildId}. Skipping.`);
        continue;
      }

      console.log(`[Scheduler] Processing guild: ${guild.name} (${guildId})`);
      const result = await questDataManager.processEndOfDay(guildId);

      if (result.success) {
        const logChannelId = await configDataManager.getLogChannel(guildId);
        if (logChannelId) {
          const logChannel = await guild.channels.fetch(logChannelId).catch(() => null);
          if (logChannel && logChannel.isTextBased()) {
            const embedColor = await configDataManager.getEmbedColor(guildId);
            const summaryEmbed = createSummaryEmbed(result.summary, embedColor);
            await logChannel.send({ embeds: [summaryEmbed] });
            console.log(`[Scheduler] Sent daily summary to log channel in ${guild.name}.`);
          }
        }
      } else if (result.error && !result.error.startsWith('報告対象')) {
        console.error(`[Scheduler] Error processing end of day for guild ${guild.name}: ${result.error}`);
      }
    } catch (error) {
      console.error(`[Scheduler] Unhandled error during daily task for guild ${guildId}:`, error);
    }
  }
  console.log('[Scheduler] Daily end-of-day process finished.');
}

function initializeScheduler(client) {
  // 毎日、日本時間(JST)の午後3時(15時)に「1日の始まり」処理を実行
  cron.schedule('0 15 * * *', () => runStartOfDayTasks(client), { scheduled: true, timezone: "Asia/Tokyo" });
  console.log('✅ Start-of-day task scheduled for 3:00 PM JST.');

  // 毎日、日本時間(JST)の午前6時に「1日の終わり」処理を実行 (30時 = 翌6時)
  cron.schedule('0 6 * * *', () => runDailyTasks(client), { scheduled: true, timezone: "Asia/Tokyo" });
  console.log('✅ End-of-day task scheduled for 6:00 AM JST.');
}

module.exports = { initializeScheduler };