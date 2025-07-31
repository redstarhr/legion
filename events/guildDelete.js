// events/guildDelete.js

module.exports = {
  name: 'guildDelete',
  async execute(guild) {
    console.log(`🗑️ Botが削除された: ${guild.name} (${guild.id})`);
    try {
      const questDataManager = require('../manager/questDataManager');
      await questDataManager.deleteGuildData(guild.id);
      // TODO: GPT設定データ削除処理も追加予定
    } catch (error) {
      console.error(`⚠️ ギルド削除時の処理に失敗: ${guild.id}`, error);
    }
  },
};
