// commands/legion_chat_gpt_setti.js

const {
  SlashCommandBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  MessageFlagsBitField,
  EmbedBuilder,
} = require('discord.js');
const { isChatGptAdmin } = require('../../permissionManager');
const { handleInteractionError } = require('../../utils/interactionErrorLogger');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('legion_今日のchatgpt_設置')
    .setDescription('現在のチャンネルにChatGPT機能の操作パネルを設置します。'),

  async execute(interaction) {
    try {
      await interaction.deferReply({ ephemeral: true });

      const isAdmin = await isChatGptAdmin(interaction);
      if (!isAdmin) {
        return await interaction.editReply({
          content: '❌ 権限がありません。このコマンドは管理者専用です。',
        });
      }

      const embed = new EmbedBuilder()
        .setTitle('🤖 ChatGPT 機能パネル')
        .setDescription('以下のボタンからChatGPTの機能を利用できます。')
        .setColor(0x2ecc71);

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('chatgpt_panel_today_gpt')
          .setLabel('今日の天気/ニュース/豆知識')
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId('chatgpt_panel_open_config')
          .setLabel('⚙️ 設定')
          .setStyle(ButtonStyle.Secondary)
      );

      // Send the panel to the channel publicly
      await interaction.channel.send({ embeds: [embed], components: [row] });

      // Confirm to the user that the panel was placed
      await interaction.editReply({ content: '✅ ChatGPT機能パネルをこのチャンネルに設置しました。' });
    } catch (error) {
      await handleInteractionError({ interaction, error, context: 'ChatGPT案内メッセージ設置' });
    }
  },
};
