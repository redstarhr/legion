// commands/questConfig.js

const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const questDataManager = require('../utils/questDataManager');
const { hasQuestManagerPermission } = require('../utils/permissionUtils');

/**
 * 設定パネルのEmbedとボタンを生成する
 * @param {import('discord.js').Interaction} interaction
 * @returns {Promise<object>}
 */
async function createConfigPanel(interaction) {
  const guildId = interaction.guildId;

  // Fetch all current settings
  const logChannelId = await questDataManager.getLogChannel(guildId);
  const notificationChannelId = await questDataManager.getNotificationChannel(guildId);
  const managerRoleId = await questDataManager.getQuestManagerRole(guildId);
  const embedColor = await questDataManager.getEmbedColor(guildId);
  const buttonOrder = await questDataManager.getButtonOrder(guildId);

  const buttonNameMap = {
    accept: '受注',
    cancel: '受注取消',
    edit: '編集',
    dm: '参加者に連絡',
  };
  const friendlyButtonOrder = buttonOrder.map(key => `\`${buttonNameMap[key] || key}\``).join(' → ');

  const embed = new EmbedBuilder()
    .setTitle('⚙️ クエストBot 設定パネル')
    .setDescription('現在のBot設定です。下のボタンから各項目を設定・変更できます。')
    .setColor(embedColor)
    .addFields(
      { name: 'ログ出力チャンネル', value: logChannelId ? `<#${logChannelId}>` : '未設定', inline: true },
      { name: '受注/取消 通知チャンネル', value: notificationChannelId ? `<#${notificationChannelId}>` : '未設定', inline: true },
      { name: 'クエスト管理者ロール', value: managerRoleId ? `<@&${managerRoleId}>` : '未設定', inline: true },
      { name: '掲示板Embedカラー', value: `\`${embedColor}\``, inline: true },
      { name: '掲示板ボタン表示順', value: friendlyButtonOrder, inline: false }
    )
    .setTimestamp()
    .setFooter({ text: '各設定はサーバーごとに保存されます。' });

  const row1 = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('config_open_logChannelSelect').setLabel('ログch設定').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId('config_open_notificationChannelSelect').setLabel('通知ch設定').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId('config_open_roleSelect').setLabel('管理者ロール設定').setStyle(ButtonStyle.Secondary)
  );

  const row2 = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('config_open_colorSelect').setLabel('Embed色設定').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId('config_open_buttonOrderSelect').setLabel('ボタン順設定').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId('config_open_unlinkSelect').setLabel('掲示板連携解除').setStyle(ButtonStyle.Danger)
  );

  return { embeds: [embed], components: [row1, row2], ephemeral: true };
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('クエスト設定')
    .setDescription('Botの各種設定をボタン操作で行います。(管理者・クエスト管理者のみ)')
    // Discordのデフォルト権限からは外す。実行時に動的にチェックするため。
    .setDefaultMemberPermissions(0),

  async execute(interaction) {
    // 実行者の権限をチェック (管理者 or クエスト管理者ロール)
    if (!(await hasQuestManagerPermission(interaction))) {
      return interaction.reply({ content: 'このコマンドを実行する権限がありません。', ephemeral: true });
    }

    // 権限がある場合、設定パネルを生成して返信する
    const view = await createConfigPanel(interaction);
    await interaction.reply(view);
  },
};