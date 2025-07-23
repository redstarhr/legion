// quest_bot/interactions/buttons/configDeleteDashboard.js
const { MessageFlags } = require('discord.js');
const questDataManager = require('../../utils/questDataManager');
const { replyWithConfirmation } = require('../../components/confirmationUI');

module.exports = {
  customId: 'config_open_deleteDashboardPrompt',
  async handle(interaction) {
    try {
      const dashboard = await questDataManager.getDashboard(interaction.guildId);

      if (!dashboard) {
        return interaction.reply({
          content: '⚠️ ダッシュボードはまだ設置されていません。',
          flags: MessageFlags.Ephemeral,
        });
      }

      await replyWithConfirmation(interaction, {
        content: '**本当にクエストダッシュボードを削除しますか？**\nこの操作は元に戻せません。ダッシュボードメッセージがDiscordから削除され、設定がリセットされます。',
        confirmCustomId: 'config_confirm_deleteDashboard',
        confirmLabel: 'はい、削除します',
        cancelCustomId: 'config_cancel_deleteDashboard',
      });

    } catch (error) {
      console.error('ダッシュボード削除の確認UI表示中にエラーが発生しました:', error);
      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({ content: 'エラーが発生したため、UIを表示できませんでした。', flags: MessageFlags.Ephemeral }).catch(console.error);
      }
    }
  },
};