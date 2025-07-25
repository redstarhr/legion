const configDataManager = require('../../../manager/configDataManager');
const { logAction } = require('../../utils/logger');
const { createConfigPanel } = require('../../components/configPanel');

const { handleInteractionError } = require('../../../utils/interactionErrorLogger');
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
    { label: '黒', value: '#2c2f33' },
];

module.exports = {
  customId: 'setting_select_embed_color',
  async handle (interaction) {
    try {
      await interaction.deferUpdate();

      const selectedColor = interaction.values[0];
      const selectedOption = colorOptions.find(opt => opt.value === selectedColor) || { label: 'カスタム', value: selectedColor };

      await configDataManager.setEmbedColor(interaction.guildId, selectedColor);

      const replyMessage = `✅ Embedの色を **${selectedOption.label} (${selectedColor})** に設定しました。`;

      await logAction({ client: interaction.client, guildId: interaction.guildId, user: interaction.user }, {
        title: '⚙️ Embedカラー設定',
        description: replyMessage,
        color: '#95a5a6',
      });

      // Refresh the panel
      const newView = await createConfigPanel(interaction);
      await interaction.editReply({ content: replyMessage, ...newView });

    } catch (error) {
      await handleInteractionError({ interaction, error, context: 'Embedカラー設定' });
    }
  },
};