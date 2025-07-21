# VS Code & Git/GitHub 開発マニュアル (簡潔版)

VS Code（Visual Studio Code）ターミナルで GitHub に SSH 接続して git push（アップロード）するための一連の手順を以下に示します。

---

## ✅ 1. 準備 (PC初回のみ)

1.  **インストール:**
    *   Git
    *   VS Code
    *   Node.js
2.  **Git初期設定:** ターミナルで以下を実行。
    ```bash
    git config --global user.name "star-discord"
    git config --global user.email "star.vesta.legion.kanri@gmail.com"
    ```
---
## ✅ 2. プロジェクト設定 (初回のみ)
### 🔹 2-1. Google Cloud Firestore 設定
このBotはデータをGoogle Cloud Firestoreに保存します。
1.  **キーの準備:** Google Cloudでプロジェクトを作成し、Firestoreを有効化。サービスアカウントを作成し、**JSONキー**をダウンロードする。
2.  **キーの配置:**
    *   プロジェクトルート（`E:\共有フォルダ\legion`）に `data` フォルダを作成。
    *   ダウンロードしたJSONキーを `legion-gclkey.json` という名前で `data` フォルダに配置。
3.  **`.env` ファイル作成:** プロジェクトルートに `.env` ファイルを作成し、以下を記述。（トークン等はご自身のものに）
    ```
    CLIENT_ID=1396938937485885584
    DISCORD_TOKEN=YOUR_BOT_TOKEN
    GUILD_ID=YOUR_TEST_GUILD_ID
    GOOGLE_APPLICATION_CREDENTIALS=data/legion-gclkey.json
    ```
4.  **パッケージインストール:**
    ```bash
    npm install firebase-admin
    npm install dotenv
    ```
### 🔹 2-2. GitHubへのSSH接続設定
1.  **キー作成:** `ssh-keygen -t ed25519 -C "star.vesta.legion.kanri@gmail.com" -f ~/.ssh/legion`
2.  **GitHubに登録:** `cat ~/.ssh/legion.pub` で表示された公開鍵をGitHubのSSHキー設定に追加。
3.  **SSH設定ファイル作成:** `notepad ~/.ssh/config` を実行し、以下を貼り付けて保存。
    ```
    Host github.com
      HostName github.com
      User git
      IdentityFile ~/.ssh/legion
      IdentitiesOnly yes
    ```
4.  **SSHエージェント起動:** **管理者権限のPowerShell**で `Set-Service -Name ssh-agent -StartupType Manual; Start-Service ssh-agent` を実行。
5.  **キー追加:** VSCodeターミナルで `ssh-add ~/.ssh/legion` を実行。
6.  **接続テスト:** `ssh -T git@github.com` を実行し、認証成功メッセージを確認。

### 🔹 2-3. プロジェクトのクローンと準備
1.  **クローン:** プロジェクトを置きたいフォルダで以下を実行。
    ```bash
    git clone git@github.com:star-discord/legion_kanri_bot.git
    ```
2.  **VS Codeで開く:** クローンしてできた `legion_kanri_bot` フォルダを開く。
3.  **パッケージインストール:** VS Codeのターミナルで `npm install` を実行。

---

## ✅ 3. プロジェクトを初めてGitHubにアップロードする場合

### 🔹 3-1. ローカルリポジトリの準備とリモート接続
VSCodeのターミナルで、プロジェクトのフォルダ (`E:\共有フォルダ\legion`) にいることを確認して以下を実行します。
```bash
git init
git add .
git commit -m "initial commit"
git branch -M main
git remote add origin git@github.com:star-discord/legion_kanri_bot.git
```

### 🔹 3-2. アップロード（push）
```bash
git push -u origin main
```

---

## ✅ 4. 補足：Gitエラー対処法

| エラー例 | 対処法 |
| :--- | :--- |
| `fatal: remote origin already exists` | `git remote remove origin` してから `git remote add ...` を再実行 |
| `Permission denied (publickey)` | 手順1, 2を再確認。特にSSHエージェントが起動しているか確認。 |