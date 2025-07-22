// quest_bot/interactions/modals/questDmSubmit.js
const { EmbedBuilder } = require('discord.js');
const questDataManager = require('../../utils/questDataManager');
const { logAction } = require('../../utils/logger');

module.exports = {
  customId: 'quest_dm_submit',
  async handle(interaction) {
    await interaction.deferReply({ ephemeral: true });

    const questId = interaction.customId.split('_')[3];
    const guildId = interaction.guildId;
    const messageContent = interaction.fields.getTextInputValue('dm_message');

    const quest = await questDataManager.getQuest(guildId, questId);
    if (!quest) {
      return interaction.followUp({ content: '⚠️ 対象のクエストが見つかりませんでした。', ephemeral: true });
    }

    // Get unique participant IDs to avoid sending multiple DMs to the same person
    const participantIds = [...new Set(quest.accepted.map(a => a.userId))];

    if (participantIds.length === 0) {
      return interaction.followUp({ content: '⚠️ 連絡対象の参加者がいません。', ephemeral: true });
    }

    const dmEmbed = new EmbedBuilder()
      .setColor(0x3498db) // blue
      .setTitle(`クエスト「${quest.title || '無題'}」に関する連絡`)
      .setDescription(messageContent)
      .setFooter({ text: `送信者: ${interaction.user.tag} | サーバー: ${interaction.guild.name}` })
      .setTimestamp();

    let successCount = 0;
    let failCount = 0;
    const failedUsers = [];

    for (const userId of participantIds) {
      try {
        const user = await interaction.client.users.fetch(userId);
        await user.send({ embeds: [dmEmbed] });
        successCount++;
      } catch (error) {
        console.error(`[DM] Failed to send DM to user ${userId} for quest ${questId}:`, error.message);
        failCount++;
        failedUsers.push(`<@${userId}>`);
      }
    }

    // Log the action
    await logAction(interaction, {
      title: '✉️ 参加者へ一斉連絡',
      color: '#3498db',
      description: `**送信メッセージ:**\n>>> ${messageContent}`,
      details: {
        'クエストタイトル': quest.title || '無題',
        '対象者数': `${participantIds.length}人`,
        '送信成功': `${successCount}人`,
        '送信失敗': `${failCount}人`,
      },
    });

    // Reply to the organizer with the results
    let replyMessage = `✅ ${successCount}人の参加者にDMを送信しました。`;
    if (failCount > 0) {
      replyMessage += `\n⚠️ ${failCount}人への送信に失敗しました。相手がDMを解放していないか、Botをブロックしている可能性があります。\n失敗したユーザー: ${failedUsers.join(', ')}`;
    }
    await interaction.followUp({ content: replyMessage, ephemeral: true });
  },
};