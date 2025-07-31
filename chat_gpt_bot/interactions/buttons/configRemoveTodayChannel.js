const { MessageFlags } = require('discord.js');
const { checkAdminAndReply } = require('../../utils/permissionChecker');
const { setChatGPTConfig } = require('../../utils/configManager');
const { handleInteractionError } = require('../../../utils/interactionErrorLogger');

const CUSTOM_ID = 'chatgpt_config_remove_today_channel';

module.exports = {
  customId: CUSTOM_ID,

  async handle(interaction) {
    try {
      if (!(await checkAdminAndReply(interaction))) return;

      // 更新の応答を遅延させる（UIの動作保証のため）
      await interaction.deferUpdate();

      // 「今日のChatGPT」投稿チャンネルの設定を解除
      await setChatGPTConfig(interaction.guildId, { today_gpt_channel_id: null });

      // 完了メッセージ更新
      await interaction.editReply({
        content:
          '✅ 「今日のChatGPT」投稿チャンネルの設定を解除しました。\n' +
          '再度 `/legion_chatgpt_パネル設置` コマンドを実行して確認してください。',
        components: [],
      });
    } catch (error) {
      await handleInteractionError({
        interaction,
        error,
        context: '「今日のChatGPT」投稿チャンネル設定解除',
      });
    }
  },
};
