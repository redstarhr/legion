// legion/chat_gpt_bot/commands/legion_chat_gpt_config.js
const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
  EmbedBuilder,
  ChannelType,
} = require('discord.js');
const { handleInteractionError } = require('../../utils/interactionErrorLogger');
const { isChatGptAdmin } = require('../../manager/permissionManager');
const { getChatGPTConfig, setChatGPTConfig } = require('../utils/configManager');
const { gptConfigModal, gptSystemPromptInput, gptTemperatureInput, gptModelInput } = require('../utils/customIds');
const { logAction } = require('../../utils/logger');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('legion_chatgpt_設定')
    .setDescription('ChatGPTの応答設定を表示・編集します。(管理者のみ)')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand(subcommand =>
      subcommand
        .setName('表示')
        .setDescription('現在のChatGPT設定を表示します。')
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('編集')
        .setDescription('ChatGPTの基本設定（プロンプト等）を編集します。')
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('有効チャンネル')
        .setDescription('ChatGPTが応答するチャンネルを管理します。')
        .addStringOption(option =>
          option.setName('操作')
            .setDescription('実行する操作を選択してください。')
            .setRequired(true)
            .addChoices(
              { name: '追加', value: 'add' },
              { name: '削除', value: 'remove' },
            )
        )
        .addChannelOption(option =>
          option.setName('チャンネル')
            .setDescription('対象のテキストチャンネル')
            .setRequired(true)
            .addChannelTypes(ChannelType.GuildText)
        )
    ),

  async execute(interaction) {
    if (!(await isChatGptAdmin(interaction))) {
      return interaction.reply({
        content: '❌ このコマンドを実行する権限がありません。',
        ephemeral: true,
      });
    }

    const subcommand = interaction.options.getSubcommand();

    try {
      switch (subcommand) {
        case '表示':
          await handleView(interaction);
          break;
        case '編集':
          await handleEdit(interaction);
          break;
        case '有効チャンネル':
          await handleChannel(interaction);
          break;
      }
    } catch (error) {
      await handleInteractionError({ interaction, error, context: `ChatGPT設定 (${subcommand})` });
    }
  },
};

async function handleView(interaction) {
  await interaction.deferReply({ ephemeral: true });
  const gptConfig = await getChatGPTConfig(interaction.guildId);

  const embed = new EmbedBuilder()
    .setTitle('🤖 ChatGPT 設定')
    .setColor(0x10A37F)
    .setDescription('現在のChatGPT Botの設定です。')
    .addFields(
      { name: 'システムプロンプト', value: `\`\`\`${gptConfig.systemPrompt || '未設定 (デフォルト)'}\`\`\`` },
      { name: 'モデル', value: `\`${gptConfig.model || '未設定 (デフォルト)'}\``, inline: true },
      { name: 'Temperature', value: `\`${gptConfig.temperature !== undefined ? gptConfig.temperature : '未設定 (デフォルト)'}\``, inline: true },
      { name: '有効チャンネル', value: gptConfig.allowedChannels?.length > 0 ? gptConfig.allowedChannels.map(id => `<#${id}>`).join('\n') : 'なし' }
    )
    .setTimestamp()
    .setFooter({ text: '設定を変更するには `/legion_chatgpt_設定 編集` や `/legion_chatgpt_設定 有効チャンネル` を使用してください。' });

  await interaction.editReply({ embeds: [embed] });
}

async function handleEdit(interaction) {
  const gptConfig = await getChatGPTConfig(interaction.guildId);

  const modal = new ModalBuilder()
    .setCustomId(gptConfigModal)
    .setTitle('ChatGPT 設定の編集');

  modal.addComponents(
    new ActionRowBuilder().addComponents(
      new TextInputBuilder().setCustomId(gptSystemPromptInput).setLabel('システムプロンプト (空欄でリセット)').setPlaceholder('例: あなたは〇〇軍団の優秀なアシスタントです。').setStyle(TextInputStyle.Paragraph).setValue(gptConfig.systemPrompt || '').setRequired(false)
    ),
    new ActionRowBuilder().addComponents(
      new TextInputBuilder().setCustomId(gptTemperatureInput).setLabel('Temperature (0.0-2.0, 空欄でリセット)').setPlaceholder('例: 0.7 (応答の多様性。デフォルトは1.0)').setStyle(TextInputStyle.Short).setValue(gptConfig.temperature !== undefined ? String(gptConfig.temperature) : '').setRequired(false)
    ),
    new ActionRowBuilder().addComponents(
      new TextInputBuilder().setCustomId(gptModelInput).setLabel('使用モデル (空欄でリセット)').setPlaceholder('例: gpt-4-turbo (デフォルトは gpt-4-turbo)').setStyle(TextInputStyle.Short).setValue(gptConfig.model || '').setRequired(false)
    )
  );

  await interaction.showModal(modal);
}

async function handleChannel(interaction) {
  await interaction.deferReply({ ephemeral: true });
  const operation = interaction.options.getString('操作');
  const channel = interaction.options.getChannel('チャンネル');

  const gptConfig = await getChatGPTConfig(interaction.guildId);
  const allowedChannels = new Set(gptConfig.allowedChannels || []);

  if (operation === 'add') {
    if (allowedChannels.has(channel.id)) {
      return interaction.editReply({ content: `✅ チャンネル <#${channel.id}> は既に有効化されています。` });
    }
    allowedChannels.add(channel.id);
    await setChatGPTConfig(interaction.guildId, { allowedChannels: Array.from(allowedChannels) });
    await interaction.editReply({ content: `✅ チャンネル <#${channel.id}> を自動応答の対象に追加しました。` });
  } else if (operation === 'remove') {
    if (!allowedChannels.has(channel.id)) {
      return interaction.editReply({ content: `ℹ️ チャンネル <#${channel.id}> は元々有効化されていません。` });
    }
    allowedChannels.delete(channel.id);
    await setChatGPTConfig(interaction.guildId, { allowedChannels: Array.from(allowedChannels) });
    await interaction.editReply({ content: `✅ チャンネル <#${channel.id}> を自動応答の対象から削除しました。` });
  }
}