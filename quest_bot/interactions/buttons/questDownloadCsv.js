// quest_bot/interactions/buttons/questDownloadCsv.js
const { AttachmentBuilder } = require('discord.js');
const questDataManager = require('../../utils/questDataManager');
const { hasQuestManagerPermission } = require('../../utils/permissionUtils');
const { logAction } = require('../../utils/logger');

module.exports = {
  customId: 'quest_action_downloadCsv_', // Prefix match
  async handle (interaction) {
    await interaction.deferReply({ ephemeral: true });

    const questId = interaction.customId.split('_')[3]; // quest_download_csv_QUESTID
    const quest = await questDataManager.getQuest(interaction.guildId, questId);

    if (!quest) {
      return interaction.followUp({ content: '対象のクエストが見つかりませんでした。' });
    }

    // 権限チェック: 発注者または管理者
    const isIssuer = quest.issuerId === interaction.user.id;
    const isManager = await hasQuestManagerPermission(interaction);

    if (!isIssuer && !isManager) {
      return interaction.followUp({ content: '参加者リストのダウンロードは、発注者または管理者のみが行えます。' });
    }

    if (!quest.accepted || quest.accepted.length === 0) {
      return interaction.followUp({ content: 'ダウンロード対象の参加者がいません。' });
    }

    // 1. CSVヘッダーを作成
    const header = [
      'UserID',
      'UserTag',
      'Teams',
      'People',
      'Comment',
      'Timestamp',
      'ChannelName'
    ];
    let csvContent = header.join(',') + '\n';

    // 2. 参加者データを追加
    for (const p of quest.accepted) {
      const timestamp = new Date(p.timestamp).toISOString();
      // コメント内のカンマとダブルクォートをエスケープ
      const comment = p.comment ? `"${p.comment.replace(/"/g, '""')}"` : '';
      const row = [
        p.userId,
        p.user,
        p.teams,
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
    await logAction(interaction, {
      title: '📥 参加者リストDL',
      color: '#71368a', // purple
      details: {
        'クエストタイトル': quest.title || '無題',
        'クエストID': questId,
        '参加者数': `${quest.accepted.length}人`,
      },
    });

    // 5. ユーザーにファイルを送信
    await interaction.followUp({
      content: '✅ 参加者リストのCSVファイルを生成しました。',
      files: [attachment],
    });
  },
};