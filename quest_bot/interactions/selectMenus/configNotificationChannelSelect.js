// quest_bot/interactions/selectMenus/configNotificationChannelSelect.js
const questDataManager = require('../../utils/questDataManager');
const { logAction } = require('../../utils/logger');

module.exports = {
  customId: 'config_select_notificationChannel_', // Prefix match
  async handle (interaction) {
    try {
      await interaction.deferUpdate();

      const selectedChannelId = interaction.values[0];
      const channel = await interaction.guild.channels.fetch(selectedChannelId);

      if (!channel) {
          return interaction.editReply({ content: '⚠️ 選択されたチャンネルが見つかりませんでした。', components: [] });
      }

      // 1. データベースを更新
      await questDataManager.setNotificationChannel(interaction.guildId, selectedChannelId);

      const replyMessage = `✅ 通知チャンネルを <#${channel.id}> に設定しました。`;

      // 2. アクションをログに記録
      await logAction(interaction, {
        title: '⚙️ 通知チャンネル設定',
        description: replyMessage,
        color: '#95a5a6',
        details: {
          '設定チャンネル': `<#${channel.id}>`,
        },
      });

      // 3. 設定用メッセージを更新して完了を通知
      await interaction.editReply({
        content: replyMessage,
        components: [], // メニューを削除
      });
    } catch (error) {
      console.error('通知チャンネルの設定処理中にエラーが発生しました:', error);
      await interaction.editReply({ content: 'エラーが発生したため、チャンネルを設定できませんでした。', components: [] });
    }
  },
};