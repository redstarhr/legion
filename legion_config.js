// e:/共有フォルダ/legion/admin_bot/commands/legion_config.js
const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const { isLegionAdmin } = require('../../manager/permissionManager');
const { setLogChannel, getLogChannel } = require('../../manager/configDataManager');
const { handleInteractionError } = require('../../utils/interactionErrorLogger');
const { createSuccessEmbed, createAdminEmbed } = require('../../utils/embedHelper');
const { createLegionConfigPanel } = require('../components/configPanel');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('legion_config')
    .setDescription('Legion Botの全体設定を管理します。')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand(subcommand =>
      subcommand
        .setName('roles')
        .setDescription('各種管理者ロールを設定します。')
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('logs')
        .setDescription('エラーログなどを送信するチャンネルを設定・確認します。')
        .addChannelOption(option =>
          option.setName('channel')
            .setDescription('設定するテキストチャンネル (未指定で現在の設定を確認)')
            .addChannelTypes(ChannelType.GuildText)
            .setRequired(false)
        )
    ),

  async execute(interaction) {
    if (!(await isLegionAdmin(interaction))) {
      return interaction.reply({ content: '❌ このコマンドを実行する権限がありません。', ephemeral: true });
    }

    const subcommand = interaction.options.getSubcommand();
    try {
      if (subcommand === 'roles') {
        const panel = await createLegionConfigPanel(interaction);
        await interaction.reply(panel);
      } else if (subcommand === 'logs') {
        await handleSetLogChannel(interaction);
      }
    } catch (error) {
      await handleInteractionError({ interaction, error, context: `Config Command (${subcommand})` });
    }
  },
};

async function handleSetLogChannel(interaction) {
  await interaction.deferReply({ ephemeral: true });
  const newChannel = interaction.options.getChannel('channel');

  if (newChannel) {
    await setLogChannel(interaction.guildId, newChannel.id);
    const embed = createSuccessEmbed('✅ ログチャンネル設定完了', `エラーログの送信先が <#${newChannel.id}> に設定されました。`);
    await interaction.editReply({ embeds: [embed] });
  } else {
    const currentChannelId = await getLogChannel(interaction.guildId);
    const description = currentChannelId ? `現在のエラーログ送信先は <#${currentChannelId}> です。` : 'エラーログを送信するチャンネルはまだ設定されていません。';
    const embed = createAdminEmbed('ℹ️ ログチャンネル設定', description);
    await interaction.editReply({ embeds: [embed] });
  }
}