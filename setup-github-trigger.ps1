<#
.SYNOPSIS
    GitHubリポジトリにpushされたときに、自動でCloud RunにデプロイするCloud Buildトリガーを作成します。
.DESCRIPTION
    このスクリプトは、指定されたGitHubリポジトリのmainブランチへのpushをトリガーとして、
    Cloud Runへのビルドとデプロイを自動的に実行するCloud Buildトリガーをセットアップします。
    初回実行時には、WebコンソールでのGitHubリポジトリへの接続承認が必要です。
#>
$ErrorActionPreference = "Stop"

# --- 色付け用 ---
$GREEN = "`e[32m"
$YELLOW = "`e[93m"
$RED = "`e[31m"
$NC = "`e[0m"

# --- 1. 共通設定とヘルパーの読み込み ---
Write-Host "${GREEN}--- Cloud Run 自動デプロイ用トリガー セットアップスクリプト ---${NC}"
. ".\scripts\config.ps1"

# --- 2. GitHubリポジトリ情報 ---
$GITHUB_REPO_OWNER = "star-discord"
$GITHUB_REPO_NAME = "legion_kanri_bot"
$TRIGGER_NAME = "trigger-deploy-${SERVICE_NAME}"

# --- 4. Cloud Buildトリガーの作成 ---
Write-Host "`n${YELLOW}1. Cloud Build トリガー '$TRIGGER_NAME' を作成または更新します...${NC}"

# gcloudコマンド用の引数を組み立て
$setSecretsArg = "DISCORD_TOKEN=DISCORD_TOKEN:latest,CLIENT_ID=CLIENT_ID:latest,GUILD_ID=GUILD_ID:latest"
$setEnvVarsArg = "GCS_BUCKET_NAME=${GCS_BUCKET_NAME},GOOGLE_APPLICATION_CREDENTIALS="

# Cloud Buildのビルドステップを定義
# --source=. は、トリガーされたリポジトリのソースコードを使うことを意味します
$buildConfig = @"
steps:
- name: 'gcr.io/google.com/cloudsdktool/cloud-sdk'
  entrypoint: 'gcloud'
  args:
    - 'run'
    - 'deploy'
    - '${SERVICE_NAME}'
    - '--source=.'
    - '--region=${REGION}'
    - '--service-account=${SERVICE_ACCOUNT_EMAIL}'
    - '--set-secrets=${setSecretsArg}'
    - '--set-env-vars=${setEnvVarsArg}'
    - '--quiet'
"@

# 一時ファイルにビルド設定を書き出す
$buildConfigFile = [System.IO.Path]::GetTempFileName()
Set-Content -Path $buildConfigFile -Value $buildConfig

Write-Host "  - GitHubリポジトリ: ${GITHUB_REPO_OWNER}/${GITHUB_REPO_NAME}"
Write-Host "  - トリガーブランチ: main"

gcloud beta builds triggers create github `
    --name=$TRIGGER_NAME `
    --repo-owner=$GITHUB_REPO_OWNER `
    --repo-name=$GITHUB_REPO_NAME `
    --branch-pattern="^main$" `
    --build-config=$buildConfigFile `
    --project=$GCP_PROJECT_ID `
    --region=$REGION `
    --quiet

Remove-Item $buildConfigFile -Force

Write-Host "`n${GREEN}✅ トリガーの作成が完了しました。${NC}"
Write-Host "💡 ${YELLOW}初回のみ、Google CloudコンソールでGitHubリポジトリへの接続を承認する必要があります。${NC}"
Write-Host "次回以降、'main'ブランチにpushすると、このBotは自動的にデプロイされます。"