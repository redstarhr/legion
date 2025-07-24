// quest_bot/interactions/modals/questDmSubmit.js
const { EmbedBuilder, MessageFlags } = require('discord.js');
const questDataManager = require('../../utils/questDataManager');
const { logAction } = require('../../utils/logger');
const { handleInteractionError } = require('../../../interactionErrorLogger');

module.exports = {
  customId: 'quest_submit_dmModal_', // Prefix match
  async handle(interaction) {
    try {
      await interaction.deferReply({ flags: [MessageFlags.Ephemeral] });

      const questId = interaction.customId.split('_')[3];
      const guildId = interaction.guildId;
      const messageContent = interaction.fields.getTextInputValue('dm_message');

      const quest = await questDataManager.getQuest(guildId, questId);
      if (!quest) {
        return interaction.editReply({ content: '⚠️ 対象のクエストが見つかりませんでした。' });
      }

      // Get unique participant IDs to avoid sending multiple DMs to the same person
      const participantIds = [...new Set(quest.accepted.map(a => a.userId))];

      if (participantIds.length === 0) {
        return interaction.editReply({ content: '⚠️ 連絡対象の参加者がいません。' });
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
      await logAction({ client: interaction.client, guildId: interaction.guildId, user: interaction.user }, {
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
      await interaction.editReply({ content: replyMessage });
    } catch (error) {
      await handleInteractionError({ interaction, error, context: '参加者DM送信' });
    }
  },
};