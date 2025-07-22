// quest_bot/interactions/buttons/configSetLogChannel.js
const { ActionRowBuilder, ChannelSelectMenuBuilder, ChannelType, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
  customId: 'config_set_log_channel',
  async handle(interaction) {
    try {
      // 他のユーザーの操作と競合しないように、インタラクションIDを含んだユニークなIDを生成
      const uniqueId = `config_log_channel_${interaction.id}`;

      const selectMenu = new ChannelSelectMenuBuilder()
        .setCustomId(`${uniqueId}_select`)
        .setPlaceholder('操作ログを出力するチャンネルを選択してください')
        .addChannelTypes(ChannelType.GuildText); // テキストチャンネルのみに限定

      const removeButton = new ButtonBuilder()
        .setCustomId(`${uniqueId}_remove`)
        .setLabel('設定を解除')
        .setStyle(ButtonStyle.Danger);

      const rowWithSelect = new ActionRowBuilder().addComponents(selectMenu);
      const rowWithButton = new ActionRowBuilder().addComponents(removeButton);

      await interaction.reply({
        content: 'Botの操作ログを出力するテキストチャンネルを選択するか、設定を解除してください。',
        components: [rowWithSelect, rowWithButton],
        ephemeral: true,
      });
    } catch (error) {
      console.error('ログチャンネル設定UIの表示中にエラーが発生しました:', error);
      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({ content: 'エラーが発生したため、UIを表示できませんでした。', ephemeral: true });
      }
    }
  },
};