// quest_bot/interactions/buttons/questReopen.js
const { MessageFlags } = require('discord.js');
const questDataManager = require('../../utils/questDataManager');
const { createQuestEmbed } = require('../../utils/embeds');
const { createQuestActionRows } = require('../../components/questActionButtons');
const { logAction } = require('../../utils/logger');
const { hasQuestManagerPermission } = require('../../utils/permissionUtils');

module.exports = {
  customId: 'quest_toggle_reopen_', // Prefix match
  async handle (interaction) {
    try {
      await interaction.deferUpdate();

      const questId = interaction.customId.split('_')[3];
      const quest = await questDataManager.getQuest(interaction.guildId, questId);

      if (!quest) {
        return interaction.followUp({ content: '対象のクエストが見つかりませんでした。', flags: MessageFlags.Ephemeral });
      }

      // Permission check: issuer or manager
      const isIssuer = quest.issuerId === interaction.user.id;
      const isManager = await hasQuestManagerPermission(interaction);

      if (!isIssuer && !isManager) {
        return interaction.followUp({ content: 'クエストの募集再開は、発注者または管理者のみが行えます。', flags: MessageFlags.Ephemeral });
      }

      // 1. クエストデータを更新して募集を再開
      await questDataManager.updateQuest(interaction.guildId, questId, { isClosed: false }, interaction.user);

      // 2. 更新後のクエストを取得し、全てのメッセージを更新
      const updatedQuest = await questDataManager.getQuest(interaction.guildId, questId);
      // 元のクエストメッセージのみ更新
      try {
        const questChannel = await interaction.client.channels.fetch(updatedQuest.channelId);
        const questMessage = await questChannel.messages.fetch(updatedQuest.messageId);
        const newEmbed = await createQuestEmbed(updatedQuest);
        const newButtons = await createQuestActionRows(updatedQuest);
        await questMessage.edit({ embeds: [newEmbed], components: newButtons });
      } catch (e) {
        console.error(`[MessageUpdate] Failed to update original quest message ${updatedQuest.messageId}:`, e);
        // ログには残すが、ユーザーへの通知は続行
      }

      // 3. アクションをログに記録
      await logAction(interaction, {
        title: '🟢 募集再開',
        color: '#2ecc71', // green
        details: {
          'クエストタイトル': updatedQuest.title || '無題',
          'クエストID': questId,
        },
      });

      // 4. 実行者に完了を通知
      await interaction.followUp({ content: '✅ クエストの募集を再開しました。', flags: MessageFlags.Ephemeral });
    } catch (error) {
      console.error('募集再開の処理中にエラーが発生しました:', error);
      // deferUpdate後なので、followUpでエラー通知
      await interaction.followUp({ content: 'エラーが発生したため、募集を再開できませんでした。', flags: MessageFlags.Ephemeral }).catch(console.error);
    }
  },
};