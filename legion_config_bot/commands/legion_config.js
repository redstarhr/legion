const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, PermissionFlagsBits, MessageFlags } = require('discord.js');
const configManager = require('../../configDataManager');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('legion設定')
    .setDescription('Legion Bot全体の管理者ロールを設定します。')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    const guildId = interaction.guildId;
    const config = await configManager.getLegionConfig(guildId);

    const embed = new EmbedBuilder()
      .setTitle('🛠️ Legion Bot 統合設定')
      .setDescription('設定したい管理者ロールの種類を選択してください。')
      .setColor(0x7289DA)
      .addFields(
        { name: 'Legion Bot 管理者', value: config.legionAdminRoleId ? `<@&${config.legionAdminRoleId}>` : '未設定', inline: true },
        { name: 'Quest Bot 管理者', value: config.questAdminRoleId ? `<@&${config.questAdminRoleId}>` : '未設定', inline: true },
        { name: 'ChatGPT Bot 管理者', value: config.chatGptAdminRoleId ? `<@&${config.chatGptAdminRoleId}>` : '未設定', inline: true }
      )
      .setTimestamp();

    const row = new ActionRowBuilder()
      .addComponents(
        new StringSelectMenuBuilder()
          .setCustomId('legion_config_select_type')
          .setPlaceholder('設定するロールの種類を選択...')
          .addOptions([
            {
              label: 'Legion Bot 管理者ロール',
              description: 'Bot全体の最上位の管理者ロールを設定します。',
              value: 'legion_admin',
            },
            {
              label: 'Quest Bot 管理者ロール',
              description: 'クエスト機能の管理者ロールを設定します。',
              value: 'quest_admin',
            },
            {
              label: 'ChatGPT Bot 管理者ロール',
              description: 'ChatGPT機能の管理者ロールを設定します。',
              value: 'chat_gpt_admin',
            },
          ])
      );

    await interaction.editReply({ embeds: [embed], components: [row] });
  },
};