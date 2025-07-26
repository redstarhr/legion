const { InteractionType, MessageFlags } = require('discord.js');
const { saveQuestConfig } = require('../../utils/configManager');
const { handleInteractionError } = require('../../utils/interactionErrorLogger');

module.exports = {
  customId: 'setting_select_dashboard_channels',

  /**
   * @param {import('discord.js').SelectMenuInteraction} interaction
   */
  async handle(interaction) {
    try {
      if (interaction.type !== InteractionType.MessageComponent) return;

      const selectedChannelIds = interaction.values; // 複数選択されたチャンネルIDの配列

      // ここで複数チャンネルの掲示板複製処理や設定保存を行う例
      // 例として設定に保存する場合（key名や仕様は適宜調整）
      await saveQuestConfig(interaction.guildId, { dashboardChannels: selectedChannelIds });

      await interaction.update({
        content: `✅ クエスト掲示板を以下のチャンネルに複製します:\n${selectedChannelIds
          .map(id => `<#${id}>`)
          .join('\n')}`,
        components: [],
        flags: MessageFlags.Ephemeral,
      });

      // 実際にはここで複製処理を呼び出すなどのロジックを追加してください
    } catch (error) {
      await handleInteractionError({
        interaction,
        error,
        context: 'クエスト掲示板複数チャンネル設定',
      });
    }
  },
};
