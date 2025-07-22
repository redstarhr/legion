// quest_bot/interactions/buttons/configSetRole.js
const { ActionRowBuilder, RoleSelectMenuBuilder, ButtonBuilder, ButtonStyle, MessageFlags } = require('discord.js');

module.exports = {
  customId: 'config_open_roleSelect',
  async handle (interaction) {
    try {
      // 他のユーザーの操作と競合しないように、インタラクションIDを含んだユニークなIDを生成
      const uniqueId = `config_select_role_${interaction.id}`;

      const selectMenu = new RoleSelectMenuBuilder()
        .setCustomId(uniqueId)
        .setPlaceholder('管理権限を付与するロールを選択してください');

      const removeButton = new ButtonBuilder()
        .setCustomId(`config_action_removeRole_${uniqueId}`)
        .setLabel('設定を解除')
        .setStyle(ButtonStyle.Danger);

      const rowWithSelect = new ActionRowBuilder().addComponents(selectMenu);
      const rowWithButton = new ActionRowBuilder().addComponents(removeButton);

      await interaction.reply({
        content: 'クエストの管理（編集、〆切、完了など）を許可するロールを選択するか、設定を解除してください。',
        components: [rowWithSelect, rowWithButton],
        flags: MessageFlags.Ephemeral,
      });
    } catch (error) {
      console.error('管理者ロール設定UIの表示中にエラーが発生しました:', error);
      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({ content: 'エラーが発生したため、UIを表示できませんでした。', flags: MessageFlags.Ephemeral }).catch(console.error);
      }
    }
  },
};