// interactions/modals/questAcceptHandler.js

const questDataManager = require('../../utils/questDataManager');
const { createQuestActionRow } = require('../../components/questActionButtons');
const { createQuestEmbed } = require('../../utils/embeds'); // 共通Embed関数をインポート

module.exports = {
  customId: 'quest_accept_submit_',

  async handle(interaction) {
    await interaction.deferUpdate();

    const originalMessageId = interaction.customId.split('_')[3];
    const guildId = interaction.guildId;

    const teams = interaction.fields.getTextInputValue('accept_teams_input');
    const people = interaction.fields.getTextInputValue('accept_people_input');

    const teamsNum = parseInt(teams, 10);
    const peopleNum = parseInt(people, 10);

    if (isNaN(teamsNum) || isNaN(peopleNum) || teamsNum <= 0 || peopleNum <= 0) {
      return interaction.followUp({ content: '⚠️ 正の数値を入力してください。', ephemeral: true });
    }

    // 1. データ更新を試みる
    const result = questDataManager.acceptQuest(guildId, originalMessageId, {
      teams: teamsNum,
      people: peopleNum,
      user: interaction.user.username,
      userId: interaction.user.id, // 受注者のIDを保存
      channelName: interaction.channel.name,
      timestamp: Date.now(), // 受注日時を保存
    });

    // エラー処理（募集数超過など）
    if (!result) {
      return interaction.followUp({ content: '⚠️ クエストデータの更新に失敗しました。', ephemeral: true });
    }
    if (result.error) {
      return interaction.followUp({ content: `⚠️ ${result.error}`, ephemeral: true });
    }

    // 2. 更新後のクエスト情報で新しいEmbedとボタンを作成
    const { quest } = result;
    const updatedEmbed = createQuestEmbed(quest);
    const updatedButtons = createQuestActionRow(quest, interaction.user.id); // 受注者のIDを渡す

    // 3. 全ての関連メッセージを更新
    const updatePromises = [];

    // 元のメッセージを更新
    const originalPromise = interaction.client.channels.fetch(quest.channelId)
      .then(channel => channel?.messages.fetch(quest.messageId))
      .then(message => message?.edit({ embeds: [updatedEmbed], components: [updatedButtons] }))
      .catch(err => console.error(`元のメッセージの更新に失敗: ${quest.messageId}`, err));
    updatePromises.push(originalPromise);

    // 連携先のメッセージを更新
    if (quest.linkedMessages) {
      for (const linked of quest.linkedMessages) {
        const linkedPromise = interaction.client.channels.fetch(linked.channelId)
          .then(channel => channel?.messages.fetch(linked.messageId))
          .then(message => message?.edit({ embeds: [updatedEmbed], components: [updatedButtons] })) // 受注者のIDを渡す
          .catch(err => console.error(`連携メッセージの更新に失敗: ch:${linked.channelId}, msg:${linked.messageId}`, err));
        updatePromises.push(linkedPromise);
      }
    }

    // すべての更新処理が完了するのを待つ
    await Promise.all(updatePromises);
  },
};