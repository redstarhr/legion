const { ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');
const { handleInteractionError } = require('../../../utils/interactionErrorLogger');

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
  customId: 'setting_set_embed_color',
  async handle(interaction) {
    try {
      const selectMenu = new StringSelectMenuBuilder()
        .setCustomId('setting_select_embed_color') // setting_select_color.js に一致させる
        .setPlaceholder('クエスト掲示板のEmbedの色を選択してください')
        .addOptions(colorOptions);

      const row = new ActionRowBuilder().addComponents(selectMenu);

      await interaction.update({
        content: 'クエスト掲示板の左側に表示される色を選択してください。',
        components: [row],
      });
    } catch (error) {
      await handleInteractionError({ interaction, error, context: 'Embedカラー設定UI表示' });
    }
  },
};