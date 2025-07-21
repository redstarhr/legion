# VS Code & Git/GitHub SSH接続・操作マニュアル

VS Code（Visual Studio Code）ターミナルで GitHub に SSH 接続して git push（アップロード）するための一連の手順を以下に示します。

---

## ✅ 1. Gitの初期設定 (初回のみ)
VSCodeのターミナルで以下を実行します。

```bash
git config --global user.name "star-discord"
git config --global user.email "star.vesta.legion.kanri@gmail.com"
```

---

## ✅ 2. GitHubへのSSH接続設定 (初回のみ)

### 🔹 2-1. SSHキーの作成
VSCodeのターミナルで以下を実行します。`your_email@example.com` はご自身のものに書き換えてください。
```bash
ssh-keygen -t ed25519 -C "your_email@example.com" -f ~/.ssh/legion
```

パスフレーズ（キーのパスワード）を尋ねられますので、設定することを推奨します。

### 🔹 1-2. GitHubに公開鍵を登録
1.  `cat ~/.ssh/legion.pub` を実行し、表示された公開鍵の内容をすべてコピーします。
2.  GitHub にログイン → 右上プロフィール → **Settings**
3.  **SSH and GPG keys** → **New SSH key**
4.  **Title:** 任意 (例: `My-PC`)
5.  **Key:** コピーした `legion.pub` の内容を貼り付け
6.  **Add SSH key** をクリック

---

## ✅ 2. SSHクライアントの設定

### 🔹 2-1. SSH設定ファイルを作成
`legion` という特別な名前のキーを使ったので、SSHクライアントにそのキーを使うよう設定します。

1.  ターミナルで `notepad ~/.ssh/config` を実行します。
2.  開いたメモ帳に以下の内容を貼り付けて保存します。
    ```
    Host github.com
      HostName github.com
      User git
      IdentityFile ~/.ssh/legion
      IdentitiesOnly yes
    ```

### 🔹 2-2. SSHエージェントの起動とキーの追加 (Windows初回のみ)
1.  **管理者権限で**PowerShellを別途起動し、以下を実行します。
    ```powershell
    Set-Service -Name ssh-agent -StartupType Manual
    Start-Service ssh-agent
    ```
2.  VSCodeのターミナルに戻り、以下を実行します。
    ```bash
    ssh-add ~/.ssh/legion
    ```

### 🔹 2-3. GitHubとのSSH接続確認
```bash
ssh -T git@github.com
```
成功すると `Hi your-username! You've successfully authenticated...` と表示されます。

---

## ✅ 3. リポジトリのアップロード

### 🔹 3-1. VSCodeでローカルプロジェクトをGit管理下に置く
```bash
cd E:\共有フォルダ\legion
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