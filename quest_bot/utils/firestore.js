// quest_bot/utils/firestore.js

const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const path = require('path');
const fs = require('fs');

// .envで設定されたパスからサービスアカウントキーを読み込む
// GOOGLE_APPLICATION_CREDENTIALSは、プロジェクトのルートディレクトリからの相対パスです。
const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
if (!serviceAccountPath) {
  throw new Error('環境変数 GOOGLE_APPLICATION_CREDENTIALS が .env ファイルに設定されていません。');
}

const absolutePath = path.resolve(process.cwd(), serviceAccountPath);

if (!fs.existsSync(absolutePath)) {
  throw new Error(`Firestoreのサービスアカウントキーが見つかりません。パスを確認してください: ${absolutePath}`);
}

// require() を使ってJSONキーファイルを直接読み込みます。
const serviceAccount = require(absolutePath);

initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();

module.exports = { db };