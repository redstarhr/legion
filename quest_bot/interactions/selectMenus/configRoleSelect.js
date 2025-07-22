// quest_bot/interactions/selectMenus/configRoleSelect.js
const questDataManager = require('../../utils/questDataManager');
const { logAction } = require('../../utils/logger');

module.exports = {
  customId: 'config_select_role_', // Prefix match
  async handle (interaction) {
    try {
      await interaction.deferUpdate();

      const selectedRoleId = interaction.values[0];
      const role = await interaction.guild.roles.fetch(selectedRoleId);

      if (!role) {
          return interaction.editReply({ content: '⚠️ 選択されたロールが見つかりませんでした。', components: [] });
      }

      // 1. データベースを更新
      await questDataManager.setQuestManagerRole(interaction.guildId, selectedRoleId);

      const replyMessage = `✅ クエスト管理者ロールを **${role.name}** に設定しました。`;

      // 2. アクションをログに記録
      await logAction(interaction, {
        title: '⚙️ 管理者ロール設定',
        description: replyMessage,
        color: '#95a5a6',
        details: {
          '設定ロール': `${role.name} (${role.id})`,
        },
      });

      // 3. 設定用メッセージを更新して完了を通知
      await interaction.editReply({
        content: replyMessage,
        components: [], // メニューを削除
      });
    } catch (error) {
      console.error('管理者ロールの設定処理中にエラーが発生しました:', error);
      await interaction.editReply({ content: 'エラーが発生したため、ロールを設定できませんでした。', components: [] });
    }
  },
};