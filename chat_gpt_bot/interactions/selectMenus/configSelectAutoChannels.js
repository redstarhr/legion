// chat_gpt_bot/interactions/selectMenus/configSelectAutoChannels.js

const { MessageFlags } = require('discord.js');
const { checkAdminAndReply } = require('../../utils/permissionChecker');
const { setChatGPTConfig } = require('../../utils/configManager');
const { handleInteractionError } = require('../../../utils/interactionErrorLogger');

module.exports = {
  customId: 'chatgpt_config_select_auto_channels',
  async handle(interaction) {
    try {
      await interaction.deferUpdate();

      if (!(await checkAdminAndReply(interaction))) return;

      const selectedChannelIds = interaction.values;

      await setChatGPTConfig(interaction.guildId, { allowedChannels: selectedChannelIds });

      let confirmationMessage;
      if (selectedChannelIds.length > 0) {
        const channelMentions = selectedChannelIds.map(id => `<#${id}>`).join(' ');
        confirmationMessage = `✅ 自動応答チャンネルを以下に設定しました:\n${channelMentions}`;
      } else {
        confirmationMessage = '✅ 自動応答チャンネルをすべて解除し、機能を無効にしました。';
      }

      await interaction.editReply({
        content:
          `${confirmationMessage}\n\n再度 \`/legion_chatgpt_パネル設置\` コマンドを実行して設定を確認してください。`,
        components: [],
      });
    } catch (error) {
      await handleInteractionError({
        interaction,
        error,
        context: 'ChatGPT自動応答チャンネル保存',
      });
    }
  },
};
