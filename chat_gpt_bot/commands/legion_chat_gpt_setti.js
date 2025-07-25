// e:/共有フォルダ/legion/chat_gpt_bot/commands/legion_chat_gpt_setti.js
const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { handleInteractionError } = require('../../utils/interactionErrorLogger');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('legion_chatgpt_パネル設置')
    .setDescription('現在のチャンネルにChatGPT機能の操作パネルを設置します。(管理者のみ)')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    try {
      await interaction.reply({ content: 'このコマンドは現在開発中です。', ephemeral: true });
    } catch (error) {
      await handleInteractionError({ interaction, error, context: 'ChatGPTパネル設置' });
    }
  },
};