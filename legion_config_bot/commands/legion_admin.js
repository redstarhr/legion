// e:/共有フォルダ/legion/admin_bot/commands/legion_admin.js
const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const { isLegionAdmin } = require('../../permissionManager');
const { setLogChannel, getLogChannel } = require('../../manager/configDataManager');
const { handleInteractionError } = require('../../utils/interactionErrorLogger');
const { createSuccessEmbed, createAdminEmbed } = require('../../utils/embedHelper');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('legion_admin')
    .setDescription('Legion Botの管理者用コマンドです。')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand(subcommand =>
      subcommand
        .setName('ログチャンネル設定')
        .setDescription('エラーログなどを送信するチャンネルを設定・確認します。')
        .addChannelOption(option =>
          option.setName('チャンネル')
            .setDescription('設定するテキストチャンネル (未指定で現在の設定を確認)')
            .addChannelTypes(ChannelType.GuildText)
            .setRequired(false)
        )
    ),

  async execute(interaction) {
    if (!(await isLegionAdmin(interaction))) {
      return interaction.reply({
        content: '❌ このコマンドを実行する権限がありません。',
        ephemeral: true,
      });
    }

    const subcommand = interaction.options.getSubcommand();
    try {
      if (subcommand === 'ログチャンネル設定') {
        await handleSetLogChannel(interaction);
      }
    } catch (error) {
      await handleInteractionError({ interaction, error, context: `Admin Command (${subcommand})` });
    }
  },
};

async function handleSetLogChannel(interaction) {
  await interaction.deferReply({ ephemeral: true });
  const newChannel = interaction.options.getChannel('チャンネル');

  if (newChannel) {
    // Set new channel
    await setLogChannel(interaction.guildId, newChannel.id);
    const embed = createSuccessEmbed('✅ ログチャンネル設定完了', `エラーログの送信先が <#${newChannel.id}> に設定されました。`);
    await interaction.editReply({ embeds: [embed] });
  } else {
    // View current setting
    const currentChannelId = await getLogChannel(interaction.guildId);
    const description = currentChannelId
      ? `現在のエラーログ送信先は <#${currentChannelId}> です。`
      : 'エラーログを送信するチャンネルはまだ設定されていません。';

    const embed = createAdminEmbed('ℹ️ ログチャンネル設定', description);
    await interaction.editReply({ embeds: [embed] });
  }
}