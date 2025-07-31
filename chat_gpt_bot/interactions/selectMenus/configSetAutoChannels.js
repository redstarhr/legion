'use strict';

const { checkAdminAndReply } = require('../../utils/permissionChecker');
const { setChatGPTConfig } = require('../../utils/configManager');
const { handleInteractionError } = require('../../../utils/interactionErrorLogger');

module.exports = {
  customId: 'chatgpt_config_set_auto_channels',
  async handle(interaction) {
    try {
      if (!(await checkAdminAndReply(interaction))) return;

      await interaction.deferUpdate();

      const selectedChannelIds = interaction.values;

      await setChatGPTConfig(interaction.guildId, { allowedChannels: selectedChannelIds });

      const message = selectedChannelIds.length > 0
        ? `✅ 自動応答チャンネルを ${selectedChannelIds.map(id => `<#${id}>`).join(' ')} に設定しました。`
        : '✅ 自動応答チャンネルの設定を解除しました。今後はメンション時のみ応答します。';

      await interaction.editReply({ content: message, components: [] });
    } catch (error) {
      await handleInteractionError({ interaction, error, context: '自動応答チャンネル設定' });
    }
  },
};