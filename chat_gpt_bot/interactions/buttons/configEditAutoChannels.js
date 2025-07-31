'use strict';

const {
  ActionRowBuilder,
  ChannelSelectMenuBuilder,
  ChannelType,
} = require('discord.js');
const { checkAdminAndReply } = require('../../utils/permissionChecker');
const { getChatGPTConfig } = require('../../utils/configManager');

module.exports = {
  customId: 'chatgpt_config_edit_auto_channels',
  async handle(interaction) {
    if (!(await checkAdminAndReply(interaction))) return;

    const config = await getChatGPTConfig(interaction.guildId);
    const allowedChannels = config.allowedChannels || [];

    const selectMenu = new ChannelSelectMenuBuilder()
      .setCustomId('chatgpt_config_set_auto_channels')
      .setPlaceholder('自動応答を許可するチャンネルを選択してください')
      .setMinValues(0)
      .setMaxValues(25)
      .setChannelTypes([ChannelType.GuildText, ChannelType.PublicThread])
      .setDefaultChannels(allowedChannels.slice(0, 25)); // Can only default up to 25

    const row = new ActionRowBuilder().addComponents(selectMenu);

    await interaction.reply({
      content: 'ChatGPTが自動で応答するテキストチャンネルを選択してください。\n選択をすべて解除すると、メンション時のみ応答するようになります。',
      components: [row],
      ephemeral: true,
    });
  },
};