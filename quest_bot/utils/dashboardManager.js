// quest_bot/utils/dashboardManager.js
const { EmbedBuilder, RESTJSONErrorCodes } = require('discord.js');
const questDataManager = require('./questDataManager');
const { createDashboardActionRows } = require('../components/dashboardActionButtons');

/**
 * Generates the embeds for the quest dashboard.
 * @param {string} guildId The ID of the guild to get settings for.
 * @param {object[]} quests - An array of all quest objects.
 * @returns {EmbedBuilder[]}
 */
async function createDashboardEmbeds(guildId, quests) {
    const activeQuests = quests.filter(q => !q.isArchived);
    const embedColor = await questDataManager.getEmbedColor(guildId);
    // --- クエスト一覧 Embed ---
    const questListEmbed = new EmbedBuilder()
        .setColor(embedColor)
        .setTitle('📜 クエスト一覧');

    if (activeQuests.length > 0) {
        const questFields = activeQuests.map(q => ({
            name: q.name || '無題のクエスト',
            value: `> ${q.players}人`,
            inline: true,
        }));
        questListEmbed.addFields(questFields);
    } else {
        questListEmbed.setDescription('現在、アクティブなクエストはありません。');
    }

    // --- 受注一覧 Embed ---
    const acceptedListEmbed = new EmbedBuilder()
        .setColor(embedColor)
        .setTitle('👥 受注状況一覧');

    // 失敗していない受注情報を直接リストアップする
    const acceptedList = activeQuests.flatMap(quest =>
        quest.accepted
            .filter(acceptance => acceptance.status !== 'failed')
            .map(acceptance => `> **${quest.name || '無題のクエスト'}**: ${acceptance.userTag} さんが ${acceptance.teams}組 / ${acceptance.players}人 受注`)
    );

    if (acceptedList.length > 0) {
        acceptedListEmbed.setDescription(acceptedList.join('\n'));
    } else {
        acceptedListEmbed.setDescription('現在、クエストを受注している人はいません。');
    }

    return [questListEmbed, acceptedListEmbed];
}

/**
 * Fetches all data and updates the quest dashboard message.
 * @param {import('discord.js').Client} client
 * @param {string} guildId
 */
async function updateDashboard(client, guildId) {
  const dashboard = await questDataManager.getDashboard(guildId);
  if (!dashboard) {
    console.warn(`[Dashboard] Guild ${guildId} にダッシュボードが設定されていません。`);
    return;
  }

  try {
    const channel = await client.channels.fetch(dashboard.channelId);
    if (!channel || !channel.isTextBased()) {
      console.error(`[Dashboard] Channel ${dashboard.channelId} not found or not a text channel.`);
      return;
    }

    // 1. 古いメッセージが存在すれば削除する
    try {
      const oldMessage = await channel.messages.fetch(dashboard.messageId);
      await oldMessage.delete();
    } catch (error) {
      if (error.code !== RESTJSONErrorCodes.UnknownMessage) {
        console.error(`[Dashboard] 古いダッシュボードメッセージの削除に失敗: ${dashboard.messageId}`, error);
      }
    }

    // 2. 新しいダッシュボードの内容を生成
    const allQuests = Object.values(await questDataManager.getAllQuests(guildId));
    const embeds = await createDashboardEmbeds(guildId, allQuests);
    const components = createDashboardActionRows();

    // 3. 新しいメッセージを送信
    const newMessage = await channel.send({
      embeds: embeds,
      components: components,
    });

    // 4. 新しいメッセージIDをデータベースに保存
    await questDataManager.setDashboard(guildId, newMessage.id, channel.id);

  } catch (error) {
    // メッセージが存在しないエラー(削除された場合など)を検知したら、DBからダッシュボード設定を削除する
    if (error.code === RESTJSONErrorCodes.UnknownMessage || error.code === RESTJSONErrorCodes.UnknownChannel) {
      console.warn(`[Dashboard] ダッシュボードメッセージまたはチャンネルが見つからなかったため、設定をリセットします。`);
      await questDataManager.setDashboard(guildId, null, null);
      return;
    }
    console.error(`[Dashboard] ダッシュボードの更新に失敗しました (Guild: ${guildId}):`, error);
  }
}

module.exports = { updateDashboard };