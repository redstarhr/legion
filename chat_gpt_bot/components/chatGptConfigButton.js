// components/chatGptConfigButton.js
const {
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
  PermissionsBitField,
} = require('discord.js');
const configManager = require('../../utils/configManager');

module.exports = {
  data: {
    name: 'chatgpt_panel_config_button',
  },
  async execute(interaction) {
    if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
      return interaction.reply({
        content: '⚠️ このボタンは管理者のみ使用できます。',
        ephemeral: true,
      });
    }

    const config = await configManager.loadConfig(interaction.guildId);

    const modal = new ModalBuilder()
      .setCustomId('chatgpt_panel_config_modal')
      .setTitle('ChatGPT 設定');

    const apiKeyInput = new TextInputBuilder()
      .setCustomId('chatgpt_panel_config_api_key')
      .setLabel('OpenAI APIキー')
      .setStyle(TextInputStyle.Short)
      .setRequired(true)
      .setValue(config.apiKey || '');

    const personaInput = new TextInputBuilder()
      .setCustomId('chatgpt_panel_config_persona')
      .setLabel('ChatGPTの性格（例: 優しい秘書）')
      .setStyle(TextInputStyle.Short)
      .setRequired(false)
      .setValue(config.persona || '');

    const toneInput = new TextInputBuilder()
      .setCustomId('chatgpt_panel_config_tone_strength')
      .setLabel('口調の癖の強さ（0〜100）')
      .setStyle(TextInputStyle.Short)
      .setRequired(false)
      .setValue(String(config.toneStrength ?? '50'));

    const maxLenInput = new TextInputBuilder()
      .setCustomId('chatgpt_panel_config_max_tokens')
      .setLabel('最大文字数（トークン数）')
      .setStyle(TextInputStyle.Short)
      .setRequired(false)
      .setValue(String(config.maxTokens ?? '1000'));

    const modelInput = new TextInputBuilder()
      .setCustomId('chatgpt_panel_config_model')
      .setLabel('モデル（例: gpt-4, gpt-4o, gpt-3.5-turbo）')
      .setStyle(TextInputStyle.Short)
      .setRequired(false)
      .setValue(config.model || '');

    modal.addComponents(
      new ActionRowBuilder().addComponents(apiKeyInput),
      new ActionRowBuilder().addComponents(personaInput),
      new ActionRowBuilder().addComponents(toneInput),
      new ActionRowBuilder().addComponents(maxLenInput),
      new ActionRowBuilder().addComponents(modelInput)
    );

    await interaction.showModal(modal);
  },
};
