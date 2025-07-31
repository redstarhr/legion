const { Events } = require('discord.js');
const { Storage } = require('@google-cloud/storage');
const logger = require('../utils/logger'); // ロガーのパスは環境に合わせて調整してください

/**
 * Google Cloud Storageへの接続をチェックする関数
 */
async function checkGcsConnection() {
  const bucketName = process.env.GCS_BUCKET_NAME;
  if (!bucketName) {
    logger.warn('GCS_BUCKET_NAMEが設定されていません。GCS接続確認をスキップします。');
    return;
  }

  try {
    const storage = new Storage();
    const [exists] = await storage.bucket(bucketName).exists();
    if (exists) {
      logger.info(`✅ GCSバケット「${bucketName}」への接続を確認しました。`);
    } else {
      logger.error(`❌ GCSバケット「${bucketName}」が見つかりません。設定を確認してください。`);
    }
  } catch (error) {
    logger.error(`❌ GCSバケット「${bucketName}」への接続に失敗しました。`, error);
  }
}

/**
 * Botの起動情報をログ出力
 * @param {import('discord.js').Client} client
 */
function logBotInfo(client) {
  logger.info('------------------------------------------------------');
  logger.info(`✅ Botの準備が完了しました。ログインアカウント: ${client.user.tag}`);

  const guilds = client.guilds.cache;
  const totalMembers = guilds.reduce((acc, guild) => acc + guild.memberCount, 0);

  logger.info(`   接続サーバー数: ${guilds.size}`);
  logger.info(`   総メンバー数: ${totalMembers}`);
  logger.info('------------------------------------------------------');
}

module.exports = {
  name: Events.ClientReady,
  once: true,
  async execute(client) {
    logBotInfo(client);

    await checkGcsConnection();

    // TODO: 他に起動時の初期化処理があればここに追記
  }
};
