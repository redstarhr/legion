﻿﻿﻿# PowerShellスクリプトとして実行します
# devcmd.js を Cloud Run Job として実行し、スラッシュコマンドを登録します
#
# 使い方:
#   .\run-job.ps1          (ギルドコマンドとして登録)
#   .\run-job.ps1 -Global  (グローバルコマンドとして登録)

param (
    [switch]$Global
)

$ErrorActionPreference = "Stop"

# --- 色付け用 ---
$GREEN = "`e[32m"
$YELLOW = "`e[93m"
$RED = "`e[31m"
$NC = "`e[0m"

# --- 1. 共通設定の読み込み ---
Write-Host "${GREEN}--- Discordスラッシュコマンド登録ジョブ実行スクリプト ---${NC}"
. ".\scripts\config.ps1"

# --- 1. 必要な情報を取得 ---
Write-Host "`n${YELLOW}1. 必要な情報を取得しています...${NC}"
# デプロイ済みのサービスから最新のイメージURIを取得
$IMAGE_URI = (gcloud run services describe $SERVICE_NAME --region $REGION --format 'value(spec.template.spec.containers[0].image)')

if (-not $IMAGE_URI) {
    Write-Host "${RED}エラー: Cloud Runサービス '$SERVICE_NAME' からイメージURIを取得できませんでした。${NC}"
    Write-Host "サービスが正常にデプロイされているか確認してください。"
    exit 1
}

Write-Host "✅ プロジェクトID: $GCP_PROJECT_ID"
Write-Host "✅ 使用するコンテナイメージ: $IMAGE_URI"

# --- 3. ジョブの引数を設定 ---
$jobArgs = @("devcmd.js")
if ($Global.IsPresent) {
    $jobArgs += "--global"
    Write-Host "`n${YELLOW}🌍 グローバルコマンドとして登録します。${NC}"
} else {
    Write-Host "`n${YELLOW}🏠 ギルドコマンドとして登録します。(GUILD_IDがSecret Managerに存在することを確認してください)${NC}"
}

# --- 4. Cloud Run Job を作成または更新 ---
# 参照するシークレットを定義します。
$setSecretsArg = "DISCORD_TOKEN=DISCORD_TOKEN:latest,CLIENT_ID=CLIENT_ID:latest,GUILD_ID=GUILD_ID:latest"
Write-Host "`n${YELLOW}4. Cloud Run Job '$JOB_NAME' を作成または更新しています...${NC}"
gcloud run jobs deploy $JOB_NAME `
    --image $IMAGE_URI `
    --region $REGION `
    --command "node" `
    --args ($jobArgs -join ',') `
    --service-account="$SERVICE_ACCOUNT_EMAIL" `
    --set-secrets="$setSecretsArg" `
    --set-env-vars="GCS_BUCKET_NAME=data-quest" `
    --task-timeout=300 `
    --quiet

# --- 5. ジョブを実行 ---
Write-Host "`n${YELLOW}5. ジョブ '$JOB_NAME' を実行します... (完了までお待ちください)${NC}"
gcloud run jobs execute $JOB_NAME --region $REGION --wait

Write-Host "`n${GREEN}✅ ジョブの実行が完了しました。${NC}"
Write-Host "上記のログでコマンドが正常に登録されたか確認してください。"