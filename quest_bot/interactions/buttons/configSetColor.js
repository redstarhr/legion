// quest_bot/interactions/buttons/configSetColor.js
const { ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');

// ユーザーに提示する色の選択肢
const colorOptions = [
    { label: 'デフォルト (水色)', value: '#00bfff' },
    { label: '青', value: '#3498db' },
    { label: '緑', value: '#2ecc71' },
    { label: '赤', value: '#e74c3c' },
    { label: '紫', value: '#9b59b6' },
    { label: '黄色', value: '#f1c40f' },
    { label: 'オレンジ', value: '#e67e22' },
    { label: 'ピンク', value: '#e91e63' },
    { label: '白', value: '#ffffff' },
    { label: '黒', value: '#2c2f33' }, // Discordのダークテーマに合わせた黒
];

module.exports = {
  customId: 'config_open_colorSelect',
  async handle(interaction) {
    try {
      const uniqueId = `config_select_color_${interaction.id}`;

      const selectMenu = new StringSelectMenuBuilder()
        .setCustomId(uniqueId)
        .setPlaceholder('クエスト掲示板のEmbedの色を選択してください')
        .addOptions(colorOptions);

      const row = new ActionRowBuilder().addComponents(selectMenu);

      await interaction.reply({
        content: 'クエスト掲示板の左側に表示される色を選択してください。',
        components: [row],
        ephemeral: true,
      });
    } catch (error) {
      console.error('カラー設定UIの表示中にエラーが発生しました:', error);
      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({ content: 'エラーが発生したため、UIを表示できませんでした。', ephemeral: true });
      }
    }
  },
};