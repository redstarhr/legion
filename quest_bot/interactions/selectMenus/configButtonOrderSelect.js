// quest_bot/interactions/selectMenus/configButtonOrderSelect.js
const { ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');
const questDataManager = require('../../utils/questDataManager');
const { logAction } = require('../../utils/logger');

const allButtonOptions = [
    { label: '受注する', value: 'accept' },
    { label: '受注取消', value: 'cancel' },
    { label: '編集', value: 'edit' },
    { label: '参加者に連絡', value: 'dm' },
];

const buttonNameMap = {
    accept: '受注',
    cancel: '受注取消',
    edit: '編集',
    dm: '参加者に連絡'
};

module.exports = {
  customId: 'config_select_buttonOrder_', // Prefix match
  async handle (interaction) {
    try {
      await interaction.deferUpdate();

      const parts = interaction.customId.split('_');
      const currentStep = parseInt(parts[4], 10);
      const interactionId = parts[5];

      // customIdから既に選択済みの項目を復元
      const selectedOrder = parts.length > 6 ? parts.slice(6) : [];

      // 今回選択された項目を追加
      const newSelection = interaction.values[0];
      selectedOrder.push(newSelection);

      const nextStep = currentStep + 1;

      // 4回目の選択までは、次の選択肢を提示
      if (nextStep <= 4) {
          const remainingOptions = allButtonOptions.filter(opt => !selectedOrder.includes(opt.value));
          const newCustomId = `config_select_buttonOrder_${nextStep}_${interactionId}_${selectedOrder.join('_')}`;

          const selectMenu = new StringSelectMenuBuilder()
              .setCustomId(newCustomId)
              .setPlaceholder(`${nextStep}番目に表示するボタンを選択してください`)
              .addOptions(remainingOptions);

          const row = new ActionRowBuilder().addComponents(selectMenu);

          const friendlyOrder = selectedOrder.map(key => `\`${buttonNameMap[key]}\``).join(' > ');

          await interaction.editReply({
              content: `現在の選択: ${friendlyOrder}\n\n**${nextStep}番目**に表示するボタンを選択してください:`,
              components: [row],
          });

      } else { // 4回目の選択が終わったら、設定を保存して完了
          await questDataManager.setButtonOrder(interaction.guildId, selectedOrder);

          const friendlyOrder = selectedOrder.map(key => `\`${buttonNameMap[key]}\``).join(' > ');
          const replyMessage = `✅ ボタンの表示順を **${friendlyOrder}** に設定しました。`;

          await logAction(interaction, {
              title: '⚙️ ボタン順設定',
              description: replyMessage,
              color: '#95a5a6',
              details: {
                  '設定順': `[${selectedOrder.join(',')}]`,
              },
          });

          await interaction.editReply({
              content: replyMessage,
              components: [], // UIを削除
          });
      }
    } catch (error) {
      console.error('ボタン順の設定処理中にエラーが発生しました:', error);
      await interaction.editReply({ content: 'エラーが発生したため、ボタンの順序を設定できませんでした。', components: [] });
    }
  },
};