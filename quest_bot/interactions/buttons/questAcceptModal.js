// interactions/buttons/questAcceptModal.js

const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');

module.exports = {
  customId: 'quest_accept_modal',

  async handle(interaction) {
    // 表示するモーダルを作成
    const modal = new ModalBuilder()
      // モーダル送信時にどのクエストか判別するため、メッセージIDを含める
      .setCustomId(`quest_accept_submit_${interaction.message.id}`)
      .setTitle('クエストの受注');

    // 受注する組数を入力するテキストボックス
    const teamsInput = new TextInputBuilder()
      .setCustomId('accept_teams_input')
      .setLabel('受注する組数')
      .setStyle(TextInputStyle.Short)
      .setPlaceholder('例: 1')
      .setRequired(true);

    // 受注する人数を入力するテキストボックス
    const peopleInput = new TextInputBuilder()
      .setCustomId('accept_people_input')
      .setLabel('受注する人数')
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