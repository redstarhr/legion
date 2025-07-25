// quest_bot/interactions/buttons/questDownloadCsv.js
const { AttachmentBuilder, MessageFlags } = require('discord.js');
const questDataManager = require('../../../manager/questDataManager');
const { canEditQuest } = require('../../../permissionManager');
const { logAction } = require('../../utils/logger');
const { handleInteractionError } = require('../../../utils/interactionErrorLogger');

module.exports = {
  customId: 'quest_action_downloadCsv_', // Prefix match
  async handle (interaction) {
    try {
      await interaction.deferReply({ flags: [MessageFlags.Ephemeral] });

      const questId = interaction.customId.replace('quest_action_downloadCsv_', '');
      const quest = await questDataManager.getQuest(interaction.guildId, questId);

      if (!quest) {
        return interaction.editReply({ content: '対象のクエストが見つかりませんでした。' });
      }

      // Permission check: issuer or quest manager/creator
      if (!(await canEditQuest(interaction, quest))) {
        return interaction.editReply({ content: '参加者リストのダウンロードは、発注者または管理者のみが行えます。' });
      }

      if (!quest.accepted || quest.accepted.length === 0) {
        return interaction.editReply({ content: 'ダウンロード対象の参加者がいません。' });
      }

      // 1. CSVヘッダーを作成
      const header = [
        'UserID',
        'UserTag',
        'Status',
        'People',
        'Comment',
        'Timestamp',
        'ChannelName'
      ];
      let csvContent = header.join(',') + '\n';

      const statusMap = {
        completed: '完了',
        failed: '失敗',
      };

      // 2. 参加者データを追加
      for (const p of quest.accepted) {
        const timestamp = new Date(p.timestamp).toISOString();
        // コメント内のカンマとダブルクォートをエスケープ
        const comment = p.comment ? `"${p.comment.replace(/"/g, '""')}"` : '';
        const status = statusMap[p.status] || '受注中';
        const row = [
          p.userId,
          p.userTag,
          status,
          p.people,
          comment,
          timestamp,
          p.channelName
        ];
        csvContent += row.join(',') + '\n';
      }

      // 3. バッファと添付ファイルを作成
      const buffer = Buffer.from(csvContent, 'utf-8');
      const attachment = new AttachmentBuilder(buffer, {
        name: `quest_${questId}_participants.csv`,
      });

      // 4. アクションをログに記録
      await logAction({ client: interaction.client, guildId: interaction.guildId, user: interaction.user }, {
        title: '📥 参加者リストDL',
        color: '#71368a', // purple
        details: {
          'クエストタイトル': quest.title || '無題',
          'クエストID': questId,
          'エントリー数': `${quest.accepted.length}件`,
        },
      });

      // 5. ユーザーにファイルを送信
      await interaction.editReply({
        content: '✅ 参加者リストのCSVファイルを生成しました。',
        files: [attachment],
      });
    } catch (error) {
      await handleInteractionError({ interaction, error, context: '参加者リストダウンロード' });
    }
  },
};