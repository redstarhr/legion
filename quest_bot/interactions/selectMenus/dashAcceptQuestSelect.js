// quest_bot/interactions/selectMenus/dashAcceptQuestSelect.js
const { ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');
const questDataManager = require('../../utils/questDataManager');

module.exports = {
    customId: 'dash_select_acceptQuest_', // Prefix match
    async handle(interaction) {
        try {
            const questId = interaction.values[0];
            const quest = await questDataManager.getQuest(interaction.guildId, questId);

            if (!quest) {
                return interaction.update({ content: '⚠️ 選択されたクエストが見つかりませんでした。ダッシュボードが更新されるまでお待ちください。', components: [] });
            }

            // ユーザーが既にこのクエストを受注しているか確認
            const hasAccepted = quest.accepted?.some(a => a.userId === interaction.user.id && a.status !== 'failed');
            if (hasAccepted) {
                return interaction.update({ content: `⚠️ あなたは既にクエスト「${quest.name}」を受注済みです。変更する場合は、一度受注を取り消してください。`, components: [] });
            }

            // Filter out failed participants before calculating totals
            const activeAccepted = quest.accepted?.filter(a => a.status !== 'failed') || [];
            const acceptedPlayers = activeAccepted.reduce((sum, p) => sum + (p.players || p.people || 0), 0);
            const acceptedTeams = activeAccepted.reduce((sum, p) => sum + (p.teams || 0), 0);
            
            const remainingPlayers = (quest.players || quest.people || 1) - acceptedPlayers;
            const remainingTeams = (quest.teams || 1) - acceptedTeams;

            // 1組受注する前提でチェック
            if (remainingTeams < 1) {
                 return interaction.update({ content: '⚠️ このクエストは既に定員に達しています。（組数枠なし）', components: [] });
            }
            if (remainingPlayers <= 0) {
                 return interaction.update({ content: '⚠️ このクエストは既に定員に達しています。', components: [] });
            }

            // 募集中の人数（最大25個）の選択肢を生成
            const playerOptionsCount = Math.min(remainingPlayers, 24) + 1; // 0を含むため+1
            const playerOptions = Array.from({ length: playerOptionsCount }, (_, i) => ({
                label: `${i}人`,
                value: `${i}`,
            }));

            // チーム数は1で固定
            const teamCount = 1;

            const selectMenu = new StringSelectMenuBuilder()
                .setCustomId(`dash_select_acceptPlayers_${questId}_${teamCount}_${interaction.id}`)
                .setPlaceholder('受注する人数を選択してください')
                .addOptions(playerOptions);

            const row = new ActionRowBuilder().addComponents(selectMenu);

            await interaction.update({
                content: `**クエスト「${quest.name}」を受注します。**\n受注する**人数**を選択してください。\n（組数は1組で固定です）`,
                components: [row],
            });
        } catch (error) {
            console.error('クエスト受注UI(1/2)の表示中にエラーが発生しました:', error);
            await interaction.update({ content: 'エラーが発生したため、受注プロセスを開始できませんでした。', components: [] }).catch(console.error);
        }
    },
};