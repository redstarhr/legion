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
    .setName('chatgpt-panel')
    .setDescription('現在のチャンネルにChatGPT機能のパネルを設置します。'),

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
        .setDescription('以下のボタンから、今日の天気やニュース、豆知識などの情報を取得できます。')
        .setColor(0x2ecc71);

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('chatgpt_panel_today_gpt')
          .setLabel('今日の情報')
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId('chatgpt_panel_open_config')
          .setLabel('⚙️ 設定')
          .setStyle(ButtonStyle.Secondary)
      );

      // Send the panel to the channel publicly
      await interaction.channel.send({ embeds: [embed], components: [row] });

      // Confirm to the user that the panel was placed
      await interaction.editReply({ content: '✅ ChatGPTパネルを設置しました。' });
    } catch (error) {
      await handleInteractionError({ interaction, error, context: 'ChatGPT案内メッセージ設置' });
    }
  },
};
