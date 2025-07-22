// quest_bot/interactions/buttons/questSetupConfirm.js
const { createQuestEmbed } = require('../../utils/embeds');
const { createQuestActionRows } = require('../../utils/questActionButtons');
const questDataManager = require('../../utils/questDataManager');
const { logAction } = require('../../utils/logger');

module.exports = {
  customId: 'quest_confirm_setup_', // Prefix match
  async handle (interaction) {
    await interaction.deferUpdate();

    const interactionId = interaction.customId.split('_')[3]; // quest_confirm_setup_INTERACTIONID
    const questData = interaction.client.tempQuestData.get(interactionId);

    if (!questData) {
      return interaction.editReply({ content: 'エラー: 元の操作データが見つかりませんでした。お手数ですが、再度 `/クエスト掲示板設置` からやり直してください。', components: [] });
    }

    const createdMessages = []; // 失敗時に削除するためのメッセージリスト
    const failedChannels = [];

    try {
      // --- 1. メイン掲示板の作成 ---
      const mainChannel = await interaction.client.channels.fetch(questData.channelId);
      if (!mainChannel || !mainChannel.isTextBased()) {
        throw new Error(`メインチャンネル (${questData.channelId}) が見つからないか、テキストチャンネルではありません。`);
      }

      const embed = await createQuestEmbed(questData);
      const mainMessage = await mainChannel.send({ embeds: [embed] });
      createdMessages.push(mainMessage);

      questData.messageId = mainMessage.id;

      // --- 2. 連携掲示板の作成 ---
      const linkedChannelIds = questData.linkedChannelIds || [];
      for (const channelId of linkedChannelIds) {
        try {
          const linkedChannel = await interaction.client.channels.fetch(channelId);
          if (linkedChannel && linkedChannel.isTextBased()) {
            const linkedMessage = await linkedChannel.send({ embeds: [embed] });
            createdMessages.push(linkedMessage);
            questData.linkedMessages.push({
              channelId: linkedMessage.channelId,
              messageId: linkedMessage.id,
            });
          } else {
            failedChannels.push(channelId);
          }
        } catch (e) {
          console.error(`連携チャンネル (${channelId}) への投稿に失敗:`, e);
          failedChannels.push(channelId);
        }
      }

      // --- 3. 全ての掲示板にボタンを追加 ---
      const buttons = await createQuestActionRows(questData);
      const editPromises = createdMessages.map(msg => msg.edit({ components: buttons }));
      await Promise.all(editPromises);

      // --- 4. データベースに保存 ---
      await questDataManager.createQuest(interaction.guildId, questData.messageId, questData, interaction.user);

      // --- 5. ログ記録と完了通知 ---
      await logAction(interaction, {
        title: '✅ クエスト掲示板 設置',
        color: '#2ecc71',
        details: {
          'クエストID': questData.messageId,
          '設置チャンネル': `<#${questData.channelId}>`,
          '連携チャンネル数': `${questData.linkedMessages.length}件`,
        },
      });

      let successMessage = `✅ クエスト掲示板を <#${questData.channelId}> に設置しました。`;
      if (failedChannels.length > 0) {
        successMessage += `\n⚠️ いくつかのチャンネルへの連携に失敗しました: ${failedChannels.map(id => `<#${id}>`).join(', ')}`;
      }
      await interaction.editReply({ content: successMessage, components: [] });

    } catch (error) {
      console.error('クエスト掲示板の作成処理中に致命的なエラーが発生しました:', error);
      // 失敗した場合、作成途中のメッセージをすべて削除する
      const deletePromises = createdMessages.map(msg => msg.delete().catch(e => console.error(`作成失敗後のメッセージ削除に失敗: ${msg.id}`, e)));
      await Promise.all(deletePromises);

      await interaction.editReply({ content: `❌ エラーが発生したため、掲示板を作成できませんでした。\n理由: ${error.message}`, components: [] });
    } finally {
      // 成功・失敗にかかわらず一時データを削除
      interaction.client.tempQuestData.delete(interactionId);
    }
  },
};