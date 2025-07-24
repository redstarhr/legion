// commands/legion_chat_gpt_config.js

const { SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, MessageFlagsBitField } = require('discord.js');
const { isChatGptAdmin } = require('../../permissionManager');
const { getChatGPTConfig } = require('../utils/configManager');
const { handleInteractionError } = require('../../utils/interactionErrorLogger');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('legion_chatgpt_設定')
    .setDescription('ChatGPTの応答設定を表示・編集します'),

  async execute(interaction) {
    try {
      const isAdmin = await isChatGptAdmin(interaction);
      if (!isAdmin) {
        return await interaction.reply({
          content: '❌ 権限がありません。管理者のみ使用可能です。',
          flags: MessageFlagsBitField.Flags.Ephemeral,
        });
      }

      const config = await getChatGPTConfig(interaction.guildId);

      const embed = new EmbedBuilder()
        .setTitle('ChatGPT設定')
        .setColor(0x5865F2) // Discord Blurple
        .addFields(
          { name: 'APIキー', value: config.apiKey ? '✅ 設定済み（非表示）' : '⚠️ 未設定', inline: false },
          { name: '最大応答文字数', value: (config.maxTokens ?? '未設定').toString(), inline: true },
          { name: '曖昧さ (temperature)', value: (config.temperature ?? '未設定').toString(), inline: true },
          { name: '応答の性格・口調', value: config.persona || '未設定', inline: false },
          { name: '自動応答チャンネル', value: (config.chat_gpt_channels?.length ?? 0) > 0 ? config.chat_gpt_channels.map(id => `<#${id}>`).join('\n') : '未設定', inline: false },
          { name: '「今日のChatGPT」投稿チャンネル', value: config.today_gpt_channel_id ? `<#${config.today_gpt_channel_id}>` : '未設定', inline: false }
        );

      const buttonRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('chatgpt_config_edit_basic')
          .setLabel('基本設定を修正')
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId('chatgpt_config_edit_auto_channels')
          .setLabel('自動応答チャンネル設定')
          .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
          .setCustomId('chatgpt_config_edit_today_channel')
          .setLabel('「今日のChatGPT」チャンネル設定')
          .setStyle(ButtonStyle.Secondary)
      );

      await interaction.reply({ embeds: [embed], components: [buttonRow], flags: MessageFlagsBitField.Flags.Ephemeral });

    } catch (error) {
      await handleInteractionError({ interaction, error, context: 'ChatGPT設定表示' });
    }
  },
};
