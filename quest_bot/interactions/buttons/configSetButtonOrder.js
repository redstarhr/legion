// quest_bot/interactions/buttons/configSetButtonOrder.js
const { ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');

const buttonOptions = [
    { label: '受注する', value: 'accept' },
    { label: '受注取消', value: 'cancel' },
    { label: '編集', value: 'edit' },
    { label: '参加者に連絡', value: 'dm' },
];

module.exports = {
  customId: 'config_open_buttonOrderSelect',
  async handle(interaction) {
    try {
      // 状態管理とユーザー識別のため、ユニークなIDを生成
      // 形式: config_button_order_select_ステップ番号_インタラクションID
      const uniqueId = `config_select_buttonOrder_1_${interaction.id}`;

      const selectMenu = new StringSelectMenuBuilder()
        .setCustomId(uniqueId)
        .setPlaceholder('1番目に表示するボタンを選択してください')
        .addOptions(buttonOptions);

      const row = new ActionRowBuilder().addComponents(selectMenu);

      await interaction.reply({
        content: 'クエスト掲示板に表示するボタンの順序を1つずつ選択してください。\n\n**1番目**に表示するボタンを選択してください:',
        components: [row],
        ephemeral: true,
      });
    } catch (error) {
      console.error('ボタン順設定UIの表示中にエラーが発生しました:', error);
      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({ content: 'エラーが発生したため、UIを表示できませんでした。', ephemeral: true });
      }
    }
  },
};