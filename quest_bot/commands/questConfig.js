// commands/questConfig.js

const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const { hasQuestManagerPermission } = require('../utils/permissionUtils');
const { createConfigPanel } = require('../components/configPanel');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('クエスト設定')
    .setDescription('Botの各種設定を行います。(管理者・クエスト管理者のみ)')
    // Discordのデフォルト権限からは外す。実行時に動的にチェックするため。
    .setDefaultMemberPermissions(0),

  async execute(interaction) {
    // 実行者の権限をチェック (管理者 or クエスト管理者ロール)
    if (!(await hasQuestManagerPermission(interaction))) {
      return interaction.reply({ content: 'このコマンドを実行する権限がありません。', flags: MessageFlags.Ephemeral });
    }

    // 権限がある場合、設定パネルを生成して返信する
    const view = await createConfigPanel(interaction);
    await interaction.reply(view);
  },
};