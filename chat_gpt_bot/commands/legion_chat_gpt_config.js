// commands/legion_chat_gpt_config.js

const { SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, MessageFlagsBitField } = require('discord.js');
const { checkAdmin } = require('../utils/permissions/checkAdmin');
const { logAndReplyError } = require('../utils/errorHelper');
const { getChatGPTConfig } = require('../utils/star_chat_gpt_config/configManager');
const { idManager } = require('../utils/idManager');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('star_chat_gpt_config')
    .setDescription('ChatGPTの応答設定を表示・編集します'),

  async execute(interaction) {
    try {
      const isAdmin = await checkAdmin(interaction);
      if (!isAdmin) {
        return await interaction.reply({
          content: '❌ 権限がありません。管理者のみ使用可能です。',
          flags: MessageFlagsBitField.Flags.Ephemeral,
        });
      }

      const config = await getChatGPTConfig(interaction.guildId);

      const embed = new EmbedBuilder()
        .setTitle('ChatGPT設定')
        .setColor(0x00FF00)
        .addFields(
          { name: 'APIキー', value: config.apiKey ? '✅ 設定済み（非表示）' : '⚠️ 未設定', inline: false },
          { name: '最大応答文字数', value: (config.maxTokens ?? '未設定').toString(), inline: true },
          { name: '曖昧さ (temperature)', value: (config.temperature ?? '未設定').toString(), inline: true },
          { name: '応答の性格・口調', value: config.persona || '未設定', inline: false },
          { name: '有効チャンネル', value: (config.chat_gpt_channels?.length ?? 0) > 0 ? config.chat_gpt_channels.map(id => `<#${id}>`).join('\n') : '未設定', inline: false }
        );

      const buttonRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId(idManager.createButtonId('star_chat_gpt_config', 'edit_basic_settings'))
          .setLabel('基本設定を修正')
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId(idManager.createButtonId('star_chat_gpt_config', 'edit_channels'))
          .setLabel('対応チャンネルを修正')
          .setStyle(ButtonStyle.Secondary),
      );

      await interaction.reply({ embeds: [embed], components: [buttonRow], flags: MessageFlagsBitField.Flags.Ephemeral });

    } catch (error) {
      await logAndReplyError(interaction, error, '設定の表示中にエラーが発生しました。');
    }
  },
};
