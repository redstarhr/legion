# PowerShellスクリプトとして実行します
# エラーが発生したら即座に終了
$ErrorActionPreference = "Stop"

# --- 色付け用 (PowerShell用) ---
$GREEN = "`e[32m"
$YELLOW = "`e[93m"
$RED = "`e[31m"
$NC = "`e[0m" # No Color

# --- 1. 共通設定の読み込み ---
Write-Host "${GREEN}--- Legion管理Bot Cloud Run デプロイスクリプト (PowerShell版) ---${NC}"
. ".\scripts\config.ps1"

# --- 1. 前提条件の確認 ---
Write-Host "`n${YELLOW}1. 前提条件の確認...${NC}"
if (-not (Get-Command gcloud -ErrorAction SilentlyContinue)) {
    Write-Host "${RED}gcloud CLIが見つかりません。インストールしてください: https://cloud.google.com/sdk/docs/install${NC}"
    exit 1
}
Write-Host "✅ gcloud CLI はインストール済みです。"

# --- 2. 必要なGCP APIの有効化 ---
Write-Host "`n${YELLOW}2. 必要なGCP APIを有効化しています...${NC}"
gcloud services enable `
    run.googleapis.com `
    artifactregistry.googleapis.com `
    cloudbuild.googleapis.com `
    secretmanager.googleapis.com `
    iam.googleapis.com
Write-Host "✅ APIが有効になりました。"

$delaySeconds = 15
Write-Host "`n${YELLOW}⏳ APIの有効化がシステムに反映されるまで ${delaySeconds}秒 待機します...${NC}"
Start-Sleep -Seconds $delaySeconds

# --- 3. Cloud Buildでコンテナイメージをビルド ---
Write-Host "`n${YELLOW}3. Cloud Buildを使用してコンテナイメージをビルドします...${NC}"
$IMAGE_URI = "${REGION}-docker.pkg.dev/${GCP_PROJECT_ID}/cloud-run-source-deploy/${SERVICE_NAME}:latest"
gcloud builds submit . --tag "$IMAGE_URI" --ignore-file=.gcloudignore --project $GCP_PROJECT_ID --quiet
Write-Host "✅ コンテナイメージのビルドが完了しました: $IMAGE_URI"

# --- 4. Cloud Runへデプロイ ---
Write-Host "`n${YELLOW}4. Cloud Runにサービスをデプロイします...${NC}"
# --set-secrets でSecret Managerから値を環境変数として設定します
# GOOGLE_APPLICATION_CREDENTIALSを空にすることで、サービスアカウントの権限が自動で使われます

# 参照するシークレットを定義します。
# これらのシークレットはGoogle Cloudコンソールで事前に作成されている必要があります。
$setSecretsArg = "DISCORD_TOKEN=DISCORD_TOKEN:latest,CLIENT_ID=CLIENT_ID:latest,GUILD_ID=GUILD_ID:latest"

gcloud run deploy "$SERVICE_NAME" `
    --image "$IMAGE_URI" `
    --region "$REGION" `
    --platform "managed" `
    --min-instances=1 `
    --cpu-boost `
    --no-allow-unauthenticated `
    --service-account="$SERVICE_ACCOUNT_EMAIL" `
    --set-secrets="$setSecretsArg" `
    --set-env-vars="GCS_BUCKET_NAME=${GCS_BUCKET_NAME},GOOGLE_APPLICATION_CREDENTIALS=" `
    --quiet

Write-Host "`n${YELLOW}5. 新しいリビジョンが正常に起動したか確認しています...${NC}"

# 最新のリビジョン名を取得
$latestRevision = (gcloud run services describe $SERVICE_NAME --region $REGION --format="value(status.latestReadyRevisionName)")

if (-not $latestRevision) {
    Write-Host "${RED}エラー: 最新のリビジョン名を取得できませんでした。デプロイに失敗した可能性があります。${NC}"
    exit 1
}

Write-Host "  - 最新リビジョン: $latestRevision"

$timeoutSeconds = 90
$checkInterval = 5
$elapsed = 0
$isReady = $false

while ($elapsed -lt $timeoutSeconds) {
    $statusJson = (gcloud run revisions describe $latestRevision --region $REGION --format="json") | ConvertFrom-Json
    $readyCondition = $statusJson.status.conditions | Where-Object { $_.type -eq 'Ready' }

    if ($readyCondition.status -eq 'True') {
        $isReady = $true
        break
    }

    if ($readyCondition.status -eq 'False') {
        Write-Host "${RED}エラー: リビジョン '$latestRevision' の起動に失敗しました。${NC}"
        Write-Host "  - 理由: $($readyCondition.reason)"
        Write-Host "  - メッセージ: $($readyCondition.message)"
        $isReady = $false
        break
    }

    Write-Host "  - 待機中... ($($elapsed)s / $($timeoutSeconds)s)"
    Start-Sleep -Seconds $checkInterval
    $elapsed += $checkInterval
}

if ($isReady) {
    Write-Host "`n${GREEN}✅ デプロイが正常に完了し、リビジョン '$latestRevision' がトラフィックを処理しています。${NC}"
} else {
    Write-Host "`n${RED}❌ デプロイに失敗しました。リビジョンがタイムアウト内にReady状態になりませんでした。${NC}"
    Write-Host "以下のコマンドで詳細なログを確認してください:"
    Write-Host "${YELLOW}gcloud logging read `"resource.type=cloud_run_revision AND resource.labels.service_name=$SERVICE_NAME AND resource.labels.revision_name=$latestRevision`" --project=$GCP_PROJECT_ID --limit=50${NC}"
    exit 1
}

# --- 後続作業の案内 ---
$line = "----------------------------------------"

Write-Host $line
Write-Host "💡 次のステップ:"
Write-Host "Discordスラッシュコマンドの登録/更新が必要な場合は、以下のコマンドを実行してください:"
Write-Host "${GREEN}./run-job.ps1${NC}"
Write-Host $line