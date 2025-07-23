// quest_bot/interactions/buttons/configSetLogChannel.js
const { ChannelSelectMenuBuilder, ChannelType, MessageFlags } = require('discord.js');
const { replyWithConfigSelect } = require('../../components/configSelectUI');

module.exports = {
  customId: 'config_open_logChannelSelect',
  async handle(interaction) {
    try {
      const uniqueId = `config_select_logChannel_${interaction.id}`;

      const selectMenu = new ChannelSelectMenuBuilder()
        .setCustomId(uniqueId)
        .setPlaceholder('操作ログを出力するチャンネルを選択してください')
        .addChannelTypes(ChannelType.GuildText);

      await replyWithConfigSelect(interaction, {
        selectMenu,
        removeButtonCustomId: `config_action_removeLogChannel_${uniqueId}`,
        content: 'Botの操作ログを出力するテキストチャンネルを選択するか、設定を解除してください。',
      });
    } catch (error) {
      console.error('ログチャンネル設定UIの表示中にエラーが発生しました:', error);
      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({ content: 'エラーが発生したため、UIを表示できませんでした。', flags: MessageFlags.Ephemeral }).catch(console.error);
      }
    }
  },
};