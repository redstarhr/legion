// e:/共有フォルダ/legion/chat_gpt_bot/commands/legion_chat_gpt_usage.js
const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } = require('discord.js');
const { handleInteractionError } = require('../../utils/interactionErrorLogger');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('legion_chatgpt_使用率')
    .setDescription('今月のOpenAI API使用量を表示します。(管理者のみ)')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    try {
      await interaction.reply({ content: 'このコマンドは現在開発中です。', flags: MessageFlags.Ephemeral });
    } catch (error) {
      await handleInteractionError({ interaction, error, context: 'ChatGPT使用率表示' });
    }
  },
};