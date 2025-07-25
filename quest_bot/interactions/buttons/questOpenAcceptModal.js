// e:/共有フォルダ/legion/quest_bot/interactions/buttons/questOpenAcceptModal.js
const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');
const questDataManager = require('../../../manager/questDataManager');
const { calculateRemainingSlots } = require('../../utils/questUtils');
const { handleInteractionError } = require('../../../utils/interactionErrorLogger');
const { QUEST_ACCEPT_MODAL, QUEST_OPEN_ACCEPT_MODAL } = require('../../utils/customIds');

module.exports = {
    customId: QUEST_OPEN_ACCEPT_MODAL, // Prefix match
    async handle(interaction) {
        try {
            const questId = interaction.customId.replace(QUEST_OPEN_ACCEPT_MODAL, '');
            const quest = await questDataManager.getQuest(interaction.guildId, questId);

            if (!quest || quest.isClosed || quest.isArchived) {
                return interaction.reply({ content: '⚠️ このクエストは現在募集を締め切っているか、見つかりませんでした。', ephemeral: true });
            }

            // Check if user has already accepted
            const hasAlreadyAccepted = quest.accepted?.some(a => a.userId === interaction.user.id && a.status !== 'failed');
            if (hasAlreadyAccepted) {
                return interaction.reply({ content: '⚠️ あなたは既にこのクエストを受注済みです。', ephemeral: true });
            }

            const { remainingPeople } = calculateRemainingSlots(quest);
            if (remainingPeople <= 0) {
                 return interaction.reply({ content: '⚠️ 募集枠がありません。', ephemeral: true });
            }

            const modal = new ModalBuilder()
                .setCustomId(`${QUEST_ACCEPT_MODAL}${questId}`)
                .setTitle(`クエスト受注: ${quest.title}`);

            const peopleInput = new TextInputBuilder()
                .setCustomId('accept_people')
                .setLabel(`参加人数 (残り: ${remainingPeople}人)`)
                .setStyle(TextInputStyle.Short)
                .setPlaceholder('あなたを含めた人数を入力')
                .setRequired(true);

            const commentInput = new TextInputBuilder()
                .setCustomId('accept_comment')
                .setLabel('コメント (任意)')
                .setStyle(TextInputStyle.Paragraph)
                .setPlaceholder('例: 20時頃から参加できます！')
                .setRequired(false);

            modal.addComponents(new ActionRowBuilder().addComponents(peopleInput), new ActionRowBuilder().addComponents(commentInput));
            await interaction.showModal(modal);
        } catch (error) {
            await handleInteractionError({ interaction, error, context: 'クエスト受注モーダル表示' });
        }
    }
};