// chat_gpt_bot/commands/chatGptStatus.js
const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require('discord.js');
const { getConfig } = require('../../manager/chatGptManager');
const { isChatGptAdmin } = require('../../permissionManager');
const { handleInteractionError } = require('../../utils/interactionErrorLogger');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('chatgpt確認')
    .setDescription('現在のChatGPT連携機能の設定を確認します。(管理者のみ)'),

  async execute(interaction) {
    try {
      await interaction.deferReply({ flags: MessageFlags.Ephemeral });

      // 管理者権限をチェック
      if (!(await isChatGptAdmin(interaction))) {
        return interaction.editReply({ content: '🚫 この操作を実行する権限がありません。' });
      }

      const config = await getConfig(interaction.guildId);

      // APIキーを安全にマスクして表示
      const apiKeyStatus = config.apiKey && config.apiKey.startsWith('sk-')
        ? `✅ 設定済み (\`${config.apiKey.slice(0, 5)}...${config.apiKey.slice(-4)}\`)`
        : '⚠️ 未設定または形式が不正です';

      const embed = new EmbedBuilder()
        .setTitle('⚙️ ChatGPT 設定状況')
        .setColor('#5865F2') // Discord Blurple
        .setDescription('現在のChatGPT連携機能の設定は以下の通りです。')
        .addFields(
          { name: 'APIキー', value: apiKeyStatus, inline: false },
          { name: 'キャラクター人格 (Persona)', value: `\`\`\`${config.persona}\`\`\``, inline: false },
          { name: '得意な地域/分野', value: `\`${config.area}\``, inline: true },
          { name: '最大応答トークン数', value: `\`${config.maxTokens}\``, inline: true }
        )
        .setFooter({ text: '設定を変更するには /chatgpt設定 コマンドを使用してください。' });

      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      await handleInteractionError({ interaction, error, context: 'ChatGPT設定確認' });
    }
  },
};