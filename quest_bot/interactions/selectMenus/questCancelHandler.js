// interactions/selectMenus/questCancelHandler.js

const { EmbedBuilder } = require('discord.js');
const questDataManager = require('../../utils/questDataManager');
const { updateAllQuestMessages } = require('../../utils/messageUpdater');
const { logAction } = require('../../utils/logger');

module.exports = {
  customId: 'quest_cancel_select_', // customIdの前方一致でハンドラを特定

  async handle(interaction) {
    await interaction.deferUpdate(); // 応答を保留

    const selectedAcceptanceId = interaction.values[0]; // 選択された受注のID
    const originalMessageId = interaction.customId.split('_')[3]; // customIdからメッセージIDを抽出
    const guildId = interaction.guildId;
    const userId = interaction.user.id;

    // 通知のために、取り消される前のクエスト情報を取得
    const questBeforeCancel = questDataManager.getQuest(guildId, originalMessageId);
    if (!questBeforeCancel) {
      // このケースは稀だが、念のためハンドリング
      return interaction.followUp({ content: '⚠️ クエストデータの特定に失敗しました。', ephemeral: true });
    }
    const canceledAcceptance = questBeforeCancel.accepted.find(a => a.id === selectedAcceptanceId);

    // 1. データマネージャーで受注を取り消す
    const result = questDataManager.cancelQuestAcceptance(guildId, originalMessageId, selectedAcceptanceId);

    if (!result || !result.quest) {
      return interaction.followUp({ content: '⚠️ 受注の取り消しに失敗しました。', ephemeral: true });
    }

    const { quest } = result;

    // 募集が再開されたかチェック
    const currentAcceptedTeams = quest.accepted?.reduce((sum, a) => sum + a.teams, 0) || 0;
    const currentAcceptedPeople = quest.accepted?.reduce((sum, a) => sum + a.people, 0) || 0;
    const isNowOpen = quest.teams > 0 && currentAcceptedTeams < quest.teams && currentAcceptedPeople < quest.people;

    // もしクローズ状態からオープン状態に戻ったら、フラグを更新
    if (quest.isClosed && isNowOpen) {
      questDataManager.updateQuest(guildId, originalMessageId, { isClosed: false });
      quest.isClosed = false; // 後続のボタン生成で使うため、ローカルのオブジェクトも更新
    }

    // 2. 共通関数を使って全ての関連メッセージを更新
    await updateAllQuestMessages(interaction.client, quest, userId);

    await interaction.followUp({ content: '✅ 受注を取り消しました。', ephemeral: true });

    logAction(interaction, '受注を取り消し', `クエストID: ${originalMessageId}\n取り消した受注ID: ${selectedAcceptanceId}`);

    // 設定されたチャンネルに通知
    const notificationChannelId = questDataManager.getNotificationChannel(guildId);
    if (notificationChannelId && canceledAcceptance) {
      try {
        const notificationChannel = await interaction.client.channels.fetch(notificationChannelId);
        const notificationEmbed = new EmbedBuilder()
          .setColor(0xf4900c) // Orange
          .setTitle('⚠️ クエスト受注取り消し通知')
          .setDescription(`クエスト「${quest.title || '無題のクエスト'}」の受注が取り消されました。`)
          .addFields(
            { name: '取り消したユーザー', value: `${interaction.user.tag}` },
            { name: '取り消された内容', value: `${canceledAcceptance.teams}組 / ${canceledAcceptance.people}人` },
            { name: '元の受注があったチャンネル', value: `\`${canceledAcceptance.channelName}\`` }
          )
          .setTimestamp();
        if (notificationChannel.isTextBased()) {
          await notificationChannel.send({ embeds: [notificationEmbed] });
        }
      } catch (error) {
        console.error(`[${guildId}] クエスト通知チャンネルへの送信（取り消し通知）に失敗しました (Channel ID: ${notificationChannelId}):`, error);
        logAction(interaction, '通知失敗', `チャンネル <#${notificationChannelId}> への通知送信に失敗しました。`, '#ff0000');
      }
    }

    // 受注を取り消した本人に確認のDMを送信
    if (canceledAcceptance) {
      try {
        const questUrl = `https://discord.com/channels/${guildId}/${quest.channelId}/${quest.messageId}`;
        const dmEmbed = new EmbedBuilder()
          .setColor(0xf4900c) // Orange
          .setTitle('❌ 受注取り消し完了')
          .setDescription('クエストの受注取り消しが正常に完了しました。')
          .addFields(
            { name: 'クエスト', value: `${quest.title || '無題のクエスト'}` },
            { name: '取り消した受注内容', value: `${canceledAcceptance.teams}組 / ${canceledAcceptance.people}人` }
          )
          .setTimestamp();
        await interaction.user.send({ embeds: [dmEmbed] });
      } catch (error) {
        console.error(`[${guildId}] 受注取り消し確認DMの送信に失敗しました (User ID: ${interaction.user.id}):`, error);
      }
    }
  },
};