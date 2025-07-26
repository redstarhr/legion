const {
  ActionRowBuilder,
  ChannelSelectMenuBuilder,
  ChannelType,
  ButtonBuilder,
  ButtonStyle,
  MessageFlags,
} = require('discord.js');
const { isChatGptAdmin } = require('../../../manager/permissionManager');
const { handleInteractionError } = require('../../../utils/interactionErrorLogger');

/**
 * 権限チェック共通関数
 * @param {import('discord.js').Interaction} interaction
 * @returns {Promise<boolean>} trueなら権限あり、falseなら処理済みで終了
 */
async function checkAdminPermission(interaction) {
  if (!(await isChatGptAdmin(interaction))) {
    await interaction.reply({
      content: '🚫 この操作を実行する権限がありません。',
      flags: MessageFlags.Ephemeral,
    });
    return false;
  }
  return true;
}

const CUSTOM_ID = {
  selectTodayChannel: 'chatgpt_config_select_today_channel',
  removeTodayChannel: 'chatgpt_config_remove_today_channel',
};

module.exports = {
  customId: 'chatgpt_config_edit_today_channel',

  async handle(interaction) {
    try {
      if (!(await checkAdminPermission(interaction))) return;

      await interaction.deferUpdate();

      const selectMenu = new ChannelSelectMenuBuilder()
        .setCustomId(CUSTOM_ID.selectTodayChannel)
        .setPlaceholder('「今日のChatGPT」を投稿するチャンネルを選択してください。')
        .addChannelTypes(ChannelType.GuildText)
        .setMinValues(1)
        .setMaxValues(1);

      const removeButton = new ButtonBuilder()
        .setCustomId(CUSTOM_ID.removeTodayChannel)
        .setLabel('設定を解除')
        .setStyle(ButtonStyle.Danger);

      const row1 = new ActionRowBuilder().addComponents(selectMenu);
      const row2 = new ActionRowBuilder().addComponents(removeButton);

      await interaction.editReply({
        content: '`/今日のchatgpt` コマンドの結果を投稿するチャンネルを選択するか、設定を解除してください。',
        components: [row1, row2],
      });
    } catch (error) {
      await handleInteractionError({
        interaction,
        error,
        context: '「今日のChatGPT」チャンネル設定UI',
      });
    }
  },
};
