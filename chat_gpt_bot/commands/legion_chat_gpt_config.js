// e:/共有フォルダ/legion/chat_gpt_bot/commands/legion_chat_gpt_config.js
const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } = require('discord.js');
const { handleInteractionError } = require('../../utils/interactionErrorLogger');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('legion_chatgpt_設定')
    .setDescription('ChatGPTの応答設定を表示・編集します。(管理者のみ)')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    try {
      await interaction.reply({ content: 'このコマンドは現在開発中です。', flags: MessageFlags.Ephemeral });
    } catch (error) {
      await handleInteractionError({ interaction, error, context: 'ChatGPT設定' });
    }
  },
};