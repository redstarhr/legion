// quest_bot/interactions/buttons/configSetNotificationChannel.js
const { ChannelSelectMenuBuilder, ChannelType, MessageFlags } = require('discord.js');
const { replyWithConfigSelect } = require('../../components/configSelectUI');

module.exports = {
  customId: 'config_open_notificationChannelSelect',
  async handle(interaction) {
    try {
      const uniqueId = `config_select_notificationChannel_${interaction.id}`;

      const selectMenu = new ChannelSelectMenuBuilder()
        .setCustomId(uniqueId)
        .setPlaceholder('受注/取消通知を送るチャンネルを選択してください')
        .addChannelTypes(ChannelType.GuildText);

      await replyWithConfigSelect(interaction, {
        selectMenu,
        removeButtonCustomId: `config_action_removeNotificationChannel_${uniqueId}`,
        content: 'クエストの受注や取消があった際に通知を送るテキストチャンネルを選択するか、設定を解除してください。',
      });
    } catch (error) {
      console.error('通知チャンネル設定UIの表示中にエラーが発生しました:', error);
      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({ content: 'エラーが発生したため、UIを表示できませんでした。', flags: MessageFlags.Ephemeral }).catch(console.error);
      }
    }
  },
};