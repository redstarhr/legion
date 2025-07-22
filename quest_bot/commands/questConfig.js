// commands/questConfig.js

const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { updateConfigPanel } = require('../utils/configUpdater');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('クエスト設定')
    .setDescription('Botの各種設定をボタン操作で行います。(管理者・クエスト管理者のみ)')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    // deferReplyはupdateConfigPanel側で行うので不要
    const view = await updateConfigPanel(interaction);

    await interaction.reply(view);
  },
};