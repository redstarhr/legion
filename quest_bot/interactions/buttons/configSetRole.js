// quest_bot/interactions/buttons/configSetRole.js
const { RoleSelectMenuBuilder, MessageFlags } = require('discord.js');
const { replyWithConfigSelect } = require('../../components/configSelectUI');

module.exports = {
  customId: 'config_open_roleSelect',
  async handle (interaction) {
    try {
      const uniqueId = `config_select_role_${interaction.id}`;

      const selectMenu = new RoleSelectMenuBuilder()
        .setCustomId(uniqueId)
        .setPlaceholder('管理権限を付与するロールを選択してください');

      await replyWithConfigSelect(interaction, {
        selectMenu,
        removeButtonCustomId: `config_action_removeRole_${uniqueId}`,
        content: 'クエストの管理（編集、〆切、完了など）を許可するロールを選択するか、設定を解除してください。',
      });
    } catch (error) {
      console.error('管理者ロール設定UIの表示中にエラーが発生しました:', error);
      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({ content: 'エラーが発生したため、UIを表示できませんでした。', flags: MessageFlags.Ephemeral }).catch(console.error);
      }
    }
  },
};