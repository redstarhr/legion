// quest_bot/utils/dashboardManager.js
const { EmbedBuilder, RESTJSONErrorCodes } = require('discord.js');
const questDataManager = require('./questDataManager');
const configDataManager = require('../../manager/configDataManager');
const { createDashboardActionRows } = require('../components/dashboardActionButtons');

/**
 * Generates the embeds for the quest dashboard.
 * @param {string} guildId The ID of the guild to get settings for.
 * @param {object[]} quests - An array of all quest objects.
 * @returns {EmbedBuilder[]}
 */
async function createDashboardEmbeds(guildId, quests) {
    const activeQuests = quests.filter(q => !q.isArchived);
    const embedColor = await configDataManager.getEmbedColor(guildId);
    // --- クエスト一覧 Embed ---
    const questListEmbed = new EmbedBuilder()
        .setColor(embedColor)
        .setTitle('📜 クエスト一覧');

    if (activeQuests.length > 0) {
        // クエストを名前でグループ化
        const groupedQuests = activeQuests.reduce((acc, quest) => {
            const name = quest.name || '無題のクエスト';
            if (!acc[name]) {
                acc[name] = [];
            }
            acc[name].push(quest);
            return acc;
        }, {});

        // グループごとにフィールドを作成
        for (const [name, questsInGroup] of Object.entries(groupedQuests)) {
            // グループ内のクエストを作成順にソート
            questsInGroup.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

            const value = questsInGroup.map(q => {
                const timestamp = Math.floor(new Date(q.createdAt).getTime() / 1000);
                // 例: "> 2人 <t:1678886400:R>" (x分前 のように表示される)
                return `> ${q.players}人 <t:${timestamp}:R>`;
            }).join('\n');

            questListEmbed.addFields({ name: name, value: value, inline: false });
        }
    } else {
        questListEmbed.setDescription('現在、アクティブなクエストはありません。');
    }

    // --- 受注一覧 Embed ---
    const acceptedListEmbed = new EmbedBuilder()
        .setColor(embedColor)
        .setTitle('👥 受注状況一覧');

    // 失敗していない受注情報をクエスト名と共に取得
    const allActiveAcceptances = activeQuests.flatMap(quest =>
        (quest.accepted || [])
            .filter(acceptance => acceptance.status !== 'failed')
            .map(acceptance => ({
                questName: quest.name || '無題のクエスト',
                ...acceptance
            }))
    );

    if (allActiveAcceptances.length > 0) {
        // クエスト名で受注情報をグループ化
        const groupedAcceptances = allActiveAcceptances.reduce((acc, acceptance) => {
            if (!acc[acceptance.questName]) {
                acc[acceptance.questName] = [];
            }
            const userIdentifier = acceptance.userTag || acceptance.user || '不明なユーザー';
            const players = acceptance.players || acceptance.people || 0;
            let acceptanceString = `> ${userIdentifier} さんが ${players}人 受注`;
            // コメントがあれば短縮して追加
            if (acceptance.comment) {
                const shortComment = acceptance.comment.length > 40 ? `${acceptance.comment.substring(0, 37)}...` : acceptance.comment;
                acceptanceString += ` (💬 ${shortComment})`;
            }
            acc[acceptance.questName].push(acceptanceString);
            return acc;
        }, {});

        const description = Object.entries(groupedAcceptances)
            .map(([questName, acceptances]) => `**${questName}**\n${acceptances.join('\n')}`)
            .join('\n\n');
        acceptedListEmbed.setDescription(description.substring(0, 4096));
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
  try {
    const dashboard = await configDataManager.getDashboard(guildId);
    if (!dashboard) {
      // ダッシュボードが設定されていないのはエラーではないので、静かに終了
      return;
    }

    const channel = await client.channels.fetch(dashboard.channelId);
    if (!channel || !channel.isTextBased()) {
      console.error(`[Dashboard] Channel ${dashboard.channelId} not found or not a text channel for guild ${guildId}.`);
      return;
    }

    const allQuests = Object.values(await questDataManager.getAllQuests(guildId));
    const embeds = await createDashboardEmbeds(guildId, allQuests);
    const components = createDashboardActionRows();
    const newContent = { embeds, components };

    try {
        const message = await channel.messages.fetch(dashboard.messageId);
        await message.edit(newContent);
    } catch (error) {
        // メッセージが見つからない場合 (手動で削除されたなど) は、新しく送信して自己修復する
        if (error.code === RESTJSONErrorCodes.UnknownMessage) {
            console.warn(`[Dashboard] Dashboard message ${dashboard.messageId} not found in guild ${guildId}. Recreating...`);
            try {
                const newMessage = await channel.send(newContent);
                await configDataManager.setDashboard(guildId, newMessage.id, channel.id);
            } catch (sendError) {
                console.error(`[Dashboard] Failed to recreate dashboard in guild ${guildId}:`, sendError);
            }
        } else {
            // その他の予期せぬ編集エラーは上位のcatchに投げる
            throw error;
        }
    }
  } catch (error) {
    // チャンネルが見つからない、権限がないなどのエラーをここで捕捉
    if (error.code === RESTJSONErrorCodes.UnknownChannel) {
        console.warn(`[Dashboard] Dashboard channel for guild ${guildId} not found. Resetting config.`);
        await configDataManager.setDashboard(guildId, null, null);
    } else {
        console.error(`[Dashboard] Failed to update dashboard for guild ${guildId}:`, error);
    }
  }
}

module.exports = { updateDashboard };