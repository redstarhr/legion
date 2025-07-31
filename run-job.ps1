# PowerShellスクリプトとして実行します
# devcmd.js を Cloud Run Job として実行し、スラッシュコマンドを登録します
#
# 使い方:
#   .\run-job.ps1          (ギルドコマンドとして登録)
#   .\run-job.ps1 -Global  (グローバルコマンドとして登録)

param (
    [switch]$Global
)

$ErrorActionPreference = "Stop"

# --- Configuration (deploy-cloud-run.ps1と合わせてください) ---
$GCP_PROJECT_ID = "legion-bot-466619"
$SERVICE_NAME = "legion-kanri-bot"
$REGION = "asia-northeast1"
$JOB_NAME = "$($SERVICE_NAME)-register-commands" # ジョブ名
$SERVICE_ACCOUNT_EMAIL = "legion-bot-sa@${GCP_PROJECT_ID}.iam.gserviceaccount.com"

# --- 色付け用 ---
$GREEN = "`e[32m"
$YELLOW = "`e[93m"
$RED = "`e[31m"
$NC = "`e[0m"

Write-Host "${GREEN}--- Discordスラッシュコマンド登録ジョブ実行スクリプト ---${NC}"

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

# --- 2. .env ファイルからシークレットを読み込み ---
Write-Host "`n${YELLOW}2. .env ファイルを読み込み、ジョブに必要なシークレットを特定します...${NC}"
$envFilePath = ".\.env"
if (-not (Test-Path $envFilePath)) {
    Write-Host "${RED}エラー: .env ファイルが見つかりません。${NC}"
    exit 1
}

$secretsToDeploy = @{}
Get-Content $envFilePath | ForEach-Object {
    $line = $_.Trim()
    if ($line -and $line -notlike '#*') {
        $parts = $line -split '=', 2
        if ($parts.Length -eq 2) {
            $key = $parts[0].Trim()
            $value = $parts[1].Trim()
            if (($value.StartsWith('"') -and $value.EndsWith('"')) -or ($value.StartsWith("'") -and $value.EndsWith("'"))) {
                $value = $value.Substring(1, $value.Length - 2)
            }
            if ($key -and $value) {
                $secretsToDeploy[$key] = $value
            }
        }
    }
}

if ($secretsToDeploy.Count -eq 0) {
    Write-Host "${RED}エラー: .env ファイルに有効なキーと値のペアが見つかりませんでした。${NC}"
    exit 1
}
Write-Host "✅ .env から $($secretsToDeploy.Keys.Count) 個のシークレットを検出しました。"

# --- 3. ジョブの引数を設定 ---
$jobArgs = @("devcmd.js")
if ($Global.IsPresent) {
    $jobArgs += "--global"
    Write-Host "`n${YELLOW}🌍 グローバルコマンドとして登録します。${NC}"
} else {
    Write-Host "`n${YELLOW}🏠 ギルドコマンドとして登録します。(GUILD_IDが.envにあることを確認してください)${NC}"
}

# --- 4. Cloud Run Job を作成または更新 ---
$setSecretsArg = ($secretsToDeploy.Keys | ForEach-Object { "$_=$_:latest" }) -join ','
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