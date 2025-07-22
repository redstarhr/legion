// interactions/buttons/questAcceptModal.js

const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');
const questDataManager = require('../../utils/questDataManager');

module.exports = {
  customId: 'quest_accept_modal',

  async handle(interaction) {
    const quest = await questDataManager.getQuest(interaction.guildId, interaction.message.id);

    if (!quest) {
      // This is unlikely to happen if the button is on the message, but good to handle.
      return interaction.reply({ content: '⚠️ 対象のクエストデータが見つかりません。', ephemeral: true });
    }

    // Calculate remaining slots
    const currentAcceptedTeams = quest.accepted?.reduce((sum, a) => sum + a.teams, 0) || 0;
    const currentAcceptedPeople = quest.accepted?.reduce((sum, a) => sum + a.people, 0) || 0;
    const remainingTeams = quest.teams - currentAcceptedTeams;
    const remainingPeople = quest.people - currentAcceptedPeople;

    // 表示するモーダルを作成
    const modal = new ModalBuilder()
      // モーダル送信時にどのクエストか判別するため、メッセージIDを含める
      .setCustomId(`quest_accept_submit_${interaction.message.id}`)
      .setTitle('クエストの受注');

    // 受注する組数を入力するテキストボックス
    const teamsInput = new TextInputBuilder()
      .setCustomId('accept_teams_input')
      .setLabel(`受注する組数 (残り: ${remainingTeams}組)`)
      .setStyle(TextInputStyle.Short)
      .setPlaceholder('例: 1')
      .setRequired(true);

    // 受注する人数を入力するテキストボックス
    const peopleInput = new TextInputBuilder()
      .setCustomId('accept_people_input')
      .setLabel(`受注する人数 (残り: ${remainingPeople}人)`)
      .setStyle(TextInputStyle.Short)
      .setPlaceholder('例: 4')
      .setRequired(true);

    // コメント入力欄
    const commentInput = new TextInputBuilder()
      .setCustomId('accept_comment_input')
      .setLabel('コメント（任意）')
      .setStyle(TextInputStyle.Paragraph)
      .setPlaceholder('意気込みや連絡事項などがあれば記入してください。')
      .setRequired(false);

    modal.addComponents(
      new ActionRowBuilder().addComponents(teamsInput),
      new ActionRowBuilder().addComponents(peopleInput),
      new ActionRowBuilder().addComponents(commentInput)
    );
    await interaction.showModal(modal);
  },
};