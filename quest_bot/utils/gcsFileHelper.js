// quest_bot/utils/gcsFileHelper.js
const { Storage } = require('@google-cloud/storage');
const path = require('path');

const GCS_BUCKET_NAME = process.env.GCS_BUCKET_NAME;
if (!GCS_BUCKET_NAME) throw new Error('GCS_BUCKET_NAME is not set.');

const storage = new Storage();
const bucket = storage.bucket(GCS_BUCKET_NAME);

/**
 * GCS 上に JSON ファイルがなければ作成し、あれば読み込んで返す
 */
async function ensureJsonFile(filePath, defaultData) {
  const file = bucket.file(filePath);
  const [exists] = await file.exists();
  if (!exists) {
    await file.save(JSON.stringify(defaultData, null, 2), { contentType: 'application/json' });
    return defaultData;
  }
  const [data] = await file.download();
  return JSON.parse(data.toString('utf8'));
}

/**
 * JSON ファイルを読み込む
 */
async function readJson(filePath) {
  const file = bucket.file(filePath);
  const [exists] = await file.exists();
  if (!exists) return null;
  const [data] = await file.download();
  return JSON.parse(data.toString('utf8'));
}

/**
 * JSON ファイルを書き込む
 */
async function writeJson(filePath, data) {
  const file = bucket.file(filePath);
  await file.save(JSON.stringify(data, null, 2), { contentType: 'application/json' });
}

module.exports = {
  ensureJsonFile,
  readJson,
  writeJson,
};
