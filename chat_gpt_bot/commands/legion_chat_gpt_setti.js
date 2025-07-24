// commands/legion_chat_gpt_setti.js

const {
  SlashCommandBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  MessageFlagsBitField,
} = require('discord.js');
const { isChatGptAdmin } = require('../../permissionManager');
const { idManager } = require('../utils/idManager');
const { handleInteractionError } = require('../../interactionErrorLogger');
const { createAdminEmbed } = require('../utils/star_chat_gpt_usage/embedHelper');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('star_chat_gpt_setti')
    .setDescription('指定チャンネルにChatGPT案内メッセージとボタンを設置します'),

  async execute(interaction) {
    try {
      // すぐに deferReply で応答確保（遅延を避ける）
      await interaction.deferReply({ flags: MessageFlagsBitField.Flags.Ephemeral });

      const isAdmin = await isChatGptAdmin(interaction);
      if (!isAdmin) {
        return await interaction.editReply({
          embeds: [createAdminEmbed('❌ 権限がありません', 'このコマンドは管理者専用です。')],
        });
      }

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId(idManager.createButtonId('star_chat_gpt_setti', 'today_gpt'))
          .setLabel('🤖 今日のChatGPT')
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId(idManager.createButtonId('star_chat_gpt_setti', 'open_config'))
          .setLabel('⚙️ 設定')
          .setStyle(ButtonStyle.Secondary)
      );

      const content = `🤖 **ChatGPT案内**\n以下のボタンを押すと、「天気」「ニュース」「豆知識」などの情報が届きます。`;

      await interaction.editReply({ content, components: [row] });
    } catch (error) {
      await handleInteractionError({ interaction, error, context: 'ChatGPT案内メッセージ設置' });
    }
  },
};
