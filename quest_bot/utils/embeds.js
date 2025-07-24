// quest_bot/utils/embeds.js

const { EmbedBuilder } = require('discord.js');
const configDataManager = require('../../configDataManager');

/**
 * Creates a standardized embed for a quest object.
 * @param {object} quest The quest object, which must include a `guildId`.
 * @returns {Promise<EmbedBuilder>} A promise that resolves to a Discord EmbedBuilder instance.
 */
async function createQuestEmbed(quest) {
  // guildId is expected to be on the quest object.
  // This is ensured by the modification in questDataManager.js
  const embedColor = await configDataManager.getEmbedColor(quest.guildId);
  const embed = new EmbedBuilder().setColor(embedColor);

  embed.setTitle(quest.title || '無題のクエスト');

  if (quest.description) {
    embed.setDescription(quest.description);
  }

  // Filter out completed or failed participants before calculating totals for the "current" count
  const activeAccepted = quest.accepted?.filter(a => !a.status) || [];

  // Calculate accepted counts from active participants
  const acceptedTeams = activeAccepted.reduce((sum, a) => sum + a.teams, 0);
  const acceptedPeople = activeAccepted.reduce((sum, a) => sum + a.people, 0);

  let statusText = '';
  if (quest.isArchived) {
    statusText = '✅ **完了**';
  } else if (quest.isClosed) {
    statusText = '🚫 **募集〆切**';
  } else {
    statusText = '🟢 **募集中**';
  }

  embed.addFields(
    { name: 'ステータス', value: statusText, inline: true },
    { name: '募集枠', value: `${quest.teams}組 / ${quest.people}人`, inline: true },
    { name: '現在の受注', value: `${acceptedTeams}組 / ${acceptedPeople}人`, inline: true }
  );

  if (quest.deadline) {
    try {
      const deadlineTimestamp = Math.floor(new Date(quest.deadline).getTime() / 1000);
      embed.addFields({ name: '募集期限', value: `<t:${deadlineTimestamp}:F> (<t:${deadlineTimestamp}:R>)` });
    } catch (e) {
      console.error(`Invalid deadline format for quest ${quest.id}: ${quest.deadline}`);
      embed.addFields({ name: '募集期限', value: `無効な日付 (${quest.deadline})` });
    }
  }

  // Show all participants and their status
  if (quest.accepted && quest.accepted.length > 0) {
    const participantsList = quest.accepted.map(p => {
      let statusEmoji = '';
      if (p.status === 'completed') {
        statusEmoji = '✅ ';
      } else if (p.status === 'failed') {
        statusEmoji = '❌ ';
      }

      let participantString = `> ${statusEmoji}<@${p.userId}>: ${p.teams}組 / ${p.people}人`;
      if (p.comment) {
        const shortComment = p.comment.length > 50 ? `${p.comment.substring(0, 47)}...` : p.comment;
        participantString += ` (💬 ${shortComment})`;
      }
      return participantString;
    }).join('\n');

    // The total number of entries in the list
    embed.addFields({ name: `参加者リスト (${quest.accepted.length}名)`, value: participantsList.substring(0, 1024) });
  }

  embed.setFooter({ text: `クエストID: ${quest.id}` });
  if (quest.createdAt) {
      embed.setTimestamp(new Date(quest.createdAt));
  }

  return embed;
}

module.exports = { createQuestEmbed };