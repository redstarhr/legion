// chat_gpt/commands/kyouChatGPT.js
const { SlashCommandBuilder } = require('discord.js');
const { generateReply } = require('../manager/chatGptManager');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('今日のchatgpt')
    .setDescription('ギルド設定に従ってChatGPTが返答します。'),

  async execute(interaction) {
    await interaction.deferReply();

    try {
      // プロンプトは固定または後で動的に変更
      const prompt = '今日の日本の天気と、それに基づいた面白い豆知識を教えて。';
      const reply = await generateReply(interaction.guildId, prompt);

      await interaction.editReply({ content: reply });
    } catch (error) {
      console.error('ChatGPT応答生成エラー:', error);
      // ユーザーに分かりやすいエラーメッセージを返す
      const userErrorMessage = error.message.includes('APIキー') || error.message.includes('利用制限')
        ? `❌ ${error.message}`
        : '❌ ChatGPTの応答生成中に予期せぬエラーが発生しました。';

      await interaction.editReply({ content: userErrorMessage });
    }
  }
};