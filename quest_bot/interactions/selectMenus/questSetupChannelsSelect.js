// quest_bot/interactions/selectMenus/questSetupChannelsSelect.js

module.exports = {
  customId: 'quest_setup_channels_', // Prefix match
  async handle(interaction) {
    try {
      // このインタラクションは、選択状態を一時データに保存するだけ。
      // 実際の掲示板作成は「✅ 掲示板を作成」ボタンで行う。
      const interactionId = interaction.customId.split('_')[3];
      const tempQuestData = interaction.client.tempQuestData.get(interactionId);

      if (!tempQuestData) {
        // タイムアウトなどで一時データが消えている場合
        return interaction.update({ content: 'エラー: 元の操作データが見つかりませんでした。お手数ですが、再度 `/クエスト掲示板設置` からやり直してください。', components: [] });
      }

      // 選択されたチャンネルIDを一時データに保存
      tempQuestData.linkedChannelIds = interaction.values;
      await interaction.deferUpdate();
    } catch (error) {
      console.error('連携チャンネル選択の処理中にエラーが発生しました:', error);
    }
  },
};