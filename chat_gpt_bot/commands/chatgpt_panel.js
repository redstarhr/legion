const { SlashCommandBuilder, PermissionFlagsBits, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');

const GPT_GREEN = 0x10A37F;

module.exports = {
  data: new SlashCommandBuilder()
    .setName('chatgpt設置')
    .setDescription('ChatGPTと話せるパネルを設置します')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    const embed = new EmbedBuilder()
      .setTitle('ChatGPTパネル')
      .setDescription('ボタンを押すと ChatGPT と話せるスレッドが作成されます。\nそのスレッド内で会話してください。')
      .addFields({
        name: '今日のChatGPTを生成',
        value: '設定されたチャンネルに、天気やニュースなどの「今日のお知らせ」を投稿します。',
        inline: false,
      })
      .setColor(GPT_GREEN)
      .setTimestamp();

    // 一般ユーザー向けボタン行
    const mainActionRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('chatgpt_thread_create')
        .setLabel('Chat GPT')
        .setStyle(ButtonStyle.Primary)
    );

    // 管理者向け設定ボタン行
    const configActionRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('chatgpt_panel_config_modal')
        .setLabel('設定（モーダル）')
        .setStyle(ButtonStyle.Secondary),

      new ButtonBuilder()
        .setCustomId('chatgpt_panel_config_today_channel')
        .setLabel('今日のChatGPT送信チャンネル設定')
        .setStyle(ButtonStyle.Secondary),

      new ButtonBuilder()
        .setCustomId('chatgpt_panel_config_auto_channels')
        .setLabel('自動投稿チャンネル設定')
        .setStyle(ButtonStyle.Secondary),

      new ButtonBuilder()
        .setCustomId('chatgpt_panel_generate_today')
        .setLabel('今日のChatGPTを生成')
        .setStyle(ButtonStyle.Success)
    );

    await interaction.reply({
      embeds: [embed],
      components: [mainActionRow, configActionRow],
      ephemeral: false
    });
  },
};
    