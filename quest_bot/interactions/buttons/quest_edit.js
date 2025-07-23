const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, MessageFlags } = require('discord.js');
const questDataManager = require('../../utils/questDataManager');
const { hasQuestManagerPermission } = require('../../utils/permissionUtils');

module.exports = {
    customId: 'quest_edit_', // 'quest_edit_{questId}' に前方一致でマッチ
    async handle(interaction) {
        try {
            const questId = interaction.customId.replace('quest_edit_', '');
            const quest = await questDataManager.getQuest(interaction.guildId, questId);

            if (!quest) {
                return interaction.reply({ content: '⚠️ 編集しようとしたクエストが見つかりませんでした。', flags: MessageFlags.Ephemeral });
            }

            // 権限チェック: クエスト発行者 or 管理者
            const isIssuer = quest.issuerId === interaction.user.id;
            const isManager = await hasQuestManagerPermission(interaction);

            if (!isIssuer && !isManager) {
                return interaction.reply({ content: '🚫 このクエストを編集する権限がありません。', flags: MessageFlags.Ephemeral });
            }

            // 完了済みのクエストは編集させない
            if (quest.isArchived) {
                return interaction.reply({ content: '⚠️ 完了済みのクエストは編集できません。', flags: MessageFlags.Ephemeral });
            }

            // モーダルを作成
            const modal = new ModalBuilder()
                .setCustomId(`quest_edit_submit_${questId}`) // モーダル送信時のID
                .setTitle('クエストの編集');

            // データモデルの互換性を考慮して、両方のプロパティ名を確認
            const titleInput = new TextInputBuilder()
                .setCustomId('quest_title')
                .setLabel('クエストタイトル')
                .setStyle(TextInputStyle.Short)
                .setValue(quest.title || quest.name || '') // title と name の両方に対応
                .setRequired(true)
                .setMaxLength(100);

            const descriptionInput = new TextInputBuilder()
                .setCustomId('quest_description')
                .setLabel('クエスト詳細')
                .setStyle(TextInputStyle.Paragraph)
                .setValue(quest.description || '')
                .setRequired(false)
                .setMaxLength(1000);

            const teamsInput = new TextInputBuilder()
                .setCustomId('quest_teams')
                .setLabel('募集 組数')
                .setStyle(TextInputStyle.Short)
                .setValue(String(quest.teams || '1'))
                .setRequired(true);

            const peopleInput = new TextInputBuilder()
                .setCustomId('quest_people')
                .setLabel('募集 人数（1組あたり）')
                .setStyle(TextInputStyle.Short)
                .setValue(String(quest.people || quest.players || '1')) // people と players の両方に対応
                .setRequired(true);

            const deadlineInput = new TextInputBuilder()
                .setCustomId('quest_deadline')
                .setLabel('募集期限（YYYY-MM-DD HH:MM形式）')
                .setStyle(TextInputStyle.Short)
                .setPlaceholder('例：2024-12-31 23:59 (未入力で無期限)')
                .setValue(quest.deadline || '')
                .setRequired(false);

            modal.addComponents(
                new ActionRowBuilder().addComponents(titleInput),
                new ActionRowBuilder().addComponents(descriptionInput),
                new ActionRowBuilder().addComponents(teamsInput),
                new ActionRowBuilder().addComponents(peopleInput),
                new ActionRowBuilder().addComponents(deadlineInput)
            );

            await interaction.showModal(modal);
        } catch (error) {
            console.error('クエスト編集モーダルの表示中にエラーが発生しました:', error);
            const replyOptions = { content: 'エラーが発生したため、編集を開始できませんでした。', flags: MessageFlags.Ephemeral };
            if (interaction.replied || interaction.deferred) {
                await interaction.followUp(replyOptions).catch(console.error);
            } else {
                await interaction.reply(replyOptions).catch(console.error);
            }
        }
    }
};