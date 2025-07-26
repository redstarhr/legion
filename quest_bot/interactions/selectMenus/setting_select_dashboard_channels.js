const { RESTJSONErrorCodes, MessageFlags } = require('discord.js');
const { getDashboards, setDashboards } = require('../../utils/configManager');
const { createQuestDashboardPanel } = require('../../components/dashboardPanel');
const { handleInteractionError } = require('../../utils/interactionErrorLogger');
const { logAction } = require('../../utils/logger');

module.exports = {
  customId: 'setting_select_dashboard_channels',
  async handle(interaction) {
    try {
      await interaction.deferUpdate();

      const selectedChannelIds = interaction.values;
      const oldDashboards = await getDashboards(interaction.guildId);

      // 1. Delete old dashboards
      for (const oldDb of oldDashboards) {
        try {
          const channel = await interaction.client.channels.fetch(oldDb.channelId);
          await channel.messages.delete(oldDb.messageId);
        } catch (error) {
          if (error.code !== RESTJSONErrorCodes.UnknownMessage) {
            console.warn(`[DashboardSetup] Could not delete old dashboard message ${oldDb.messageId}:`, error.message);
          }
        }
      }

      // 2. Create new dashboards
      const newDashboards = [];
      const failedChannels = [];
      for (const channelId of selectedChannelIds) {
        try {
          const channel = await interaction.client.channels.fetch(channelId);
          if (channel && channel.isTextBased()) {
            const panel = await createQuestDashboardPanel(interaction.guild);
            const newMessage = await channel.send(panel);
            newDashboards.push({ channelId: channel.id, messageId: newMessage.id });
          } else {
            failedChannels.push(channelId);
          }
        } catch (error) {
          console.error(`[Dashboard
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
