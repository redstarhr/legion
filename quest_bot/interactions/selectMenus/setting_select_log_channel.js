const configDataManager = require('../../../manager/configDataManager');
const { logAction } = require('../../utils/logger');
const { createConfigPanel } = require('../../components/configPanel');

const { handleInteractionError } = require('../../../interactionErrorLogger');
module.exports = {
    customId: 'setting_select_log_channel',
    async handle(interaction) {
        try {
            await interaction.deferUpdate();
            const channelId = interaction.values[0];
            const channel = await interaction.guild.channels.fetch(channelId).catch(() => null);

            if (!channel) {
                return interaction.editReply({ content: '⚠️ 選択されたチャンネルが見つかりませんでした。', components: [] });
            }

            await configDataManager.setLogChannel(interaction.guildId, channelId);

            let testMessageSuccess = false;
            try {
                await channel.send({ content: '✅ このチャンネルがログ出力先に設定されました。' });
                testMessageSuccess = true;
            } catch (error) {
                console.error(`ログチャンネル (${channel.id}) へのテストメッセージ送信に失敗:`, error);
            }

            const replyMessage = `✅ ログ出力チャンネルを <#${channel.id}> に設定しました。`;
            let finalMessage = replyMessage;
            if (!testMessageSuccess) {
                finalMessage += '\n⚠️ **警告:** このチャンネルへのメッセージ送信に失敗しました。Botに「メッセージを送信」と「埋め込みリンク」の権限があるか確認してください。';
            }

            await logAction({ client: interaction.client, guildId: interaction.guildId, user: interaction.user }, {
                title: '⚙️ ログチャンネル設定',
                description: replyMessage,
                color: '#95a5a6',
            });

            const newView = await createConfigPanel(interaction);
            await interaction.editReply({ content: finalMessage, ...newView });
        } catch (error) {
            await handleInteractionError({ interaction, error, context: 'ログチャンネル設定' });
        }
    },
};