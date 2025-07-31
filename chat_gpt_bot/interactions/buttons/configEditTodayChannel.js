// chat_gpt_bot/interactions/buttons/configEditTodayChannel.js

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

// 定数ID（他のファイルと共有する場合は別ファイルに抽出してもよい）
const CUSTOM_ID = {
  SELECT_TODAY_CHANNEL: 'chatgpt_config_select_today_channel',
  REMOVE_TODAY_CHANNEL: 'chatgpt_config_remove_today_channel',
};

module.exports = {
  customId: 'chatgpt_config_edit_today_channel',

  async handle(interaction) {
    try {
      // 管理者チェック
      if (!(await isChatGptAdmin(interaction))) {
        await interaction.reply({
          content: '🚫 この操作を実行する権限がありません。',
          flags: MessageFlags.Ephemeral,
        });
        return;
      }

      await interaction.deferUpdate();

      // チャンネル選択メニュー
      const selectMenu = new ChannelSelectMenuBuilder()
        .setCustomId(CUSTOM_ID.SELECT_TODAY_CHANNEL)
        .setPlaceholder('「今日のChatGPT」投稿チャンネルを選択してください')
        .addChannelTypes(ChannelType.GuildText)
        .setMinValues(1)
        .setMaxValues(1);

      // 設定解除ボタン
      const removeButton = new ButtonBuilder()
        .setCustomId(CUSTOM_ID.REMOVE_TODAY_CHANNEL)
        .setLabel('設定を解除')
        .setStyle(ButtonStyle.Danger);

      // アクション行
      const row1 = new ActionRowBuilder().addComponents(selectMenu);
      const row2 = new ActionRowBuilder().addComponents(removeButton);

      await interaction.editReply({
        content: '📍 `/今日のchatgpt` の結果を投稿するチャンネルを以下から選択するか、設定を解除してください。',
        components: [row1, row2],
      });
    } catch (error) {
      await handleInteractionError({
        interaction,
        error,
        context: 'ChatGPT 今日の投稿チャンネル設定UI',
      });
    }
  },
};
