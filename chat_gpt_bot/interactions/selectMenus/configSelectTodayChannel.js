// chat_gpt_bot/interactions/selectMenus/configSelectTodayChannel.js

const { MessageFlags } = require('discord.js');
const { checkAdminAndReply } = require('../../utils/permissionChecker');
const { setChatGPTConfig } = require('../../utils/configManager');
const { handleInteractionError } = require('../../../utils/interactionErrorLogger');

module.exports = {
  customId: 'chatgpt_config_select_today_channel',
  async handle(interaction) {
    try {
      await interaction.deferUpdate();

      if (!(await checkAdminAndReply(interaction))) return;

      // ChannelSelectMenu with maxValues: 1 returns a single ID in the values array.
      const selectedChannelId = interaction.values[0];

      if (!selectedChannelId) {
        return interaction.editReply({
          content: '⚠️ チャンネルが選択されませんでした。',
          components: [],
        });
      }

      await setChatGPTConfig(interaction.guildId, { today_gpt_channel_id: selectedChannelId });

      await interaction.editReply({
        content:
          `✅ 「今日のChatGPT」投稿チャンネルを <#${selectedChannelId}> に設定しました。\n` +
          '再度 `/legion_chatgpt_パネル設置` コマンドを実行して確認してください。',
        components: [],
      });
    } catch (error) {
      await handleInteractionError({ interaction, error, context: '「今日のChatGPT」投稿チャンネル保存' });
    }
  },
};
