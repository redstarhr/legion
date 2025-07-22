// quest_bot/interactions/selectMenus/configColorSelect.js
const questDataManager = require('../../utils/questDataManager');
const { logAction } = require('../../utils/logger');

// 選択肢を再定義して、選択された値からラベルを取得できるようにする
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
  customId: 'config_color_', // Prefix match
  async handle(interaction) {
    try {
      await interaction.deferUpdate();

      const selectedColor = interaction.values[0];
      const selectedOption = colorOptions.find(opt => opt.value === selectedColor) || { label: 'カスタム', value: selectedColor };

      // 1. データベースを更新
      await questDataManager.setEmbedColor(interaction.guildId, selectedColor);

      const replyMessage = `✅ Embedの色を **${selectedOption.label} (${selectedColor})** に設定しました。`;

      // 2. アクションをログに記録
      await logAction(interaction, {
        title: '⚙️ Embedカラー設定',
        description: replyMessage,
        color: '#95a5a6',
        details: {
          '設定カラー': `${selectedOption.label} (${selectedColor})`,
        },
      });

      // 3. 設定用メッセージを更新して完了を通知
      await interaction.editReply({
        content: replyMessage,
        components: [], // メニューを削除
      });
    } catch (error) {
      console.error('カラー設定の処理中にエラーが発生しました:', error);
      await interaction.editReply({ content: 'エラーが発生したため、色を設定できませんでした。', components: [] });
    }
  },
};