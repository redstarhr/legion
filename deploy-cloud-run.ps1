# PowerShellスクリプトとして実行します
# エラーが発生したら即座に終了
$ErrorActionPreference = "Stop"

# --- Configuration ---
# GCPプロジェクトID
$GCP_PROJECT_ID = "legion-bot-466619"
# Cloud Runのサービス名
$SERVICE_NAME = "legion-kanri-bot"
# デプロイするリージョン
$REGION = "asia-northeast1" # 例: us-central1, asia-northeast1 (東京)
# Botが使用するGCSバケット名
$GCS_BUCKET_NAME = "data-quest"
# Bot専用のサービスアカウント
$SERVICE_ACCOUNT_EMAIL = "legion-bot-sa@${GCP_PROJECT_ID}.iam.gserviceaccount.com"

# --- 色付け用 (PowerShell用) ---
$GREEN = "`e[32m"
$YELLOW = "`e[93m"
$RED = "`e[31m"
$NC = "`e[0m" # No Color

Write-Host "${GREEN}--- Legion管理Bot Cloud Run デプロイスクリプト (PowerShell版) ---${NC}"

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

# --- 3. .env ファイルからシークレットを読み込み、Secret Managerに登録/更新 ---
Write-Host "`n${YELLOW}3. .env ファイルを読み込み、Secret Managerにシークレットを登録/更新します...${NC}"
$envFilePath = ".\.env"
if (-not (Test-Path $envFilePath)) {
    Write-Host "${RED}エラー: .env ファイルが見つかりません。${NC}"
    Write-Host "プロジェクトのルートに、デプロイに必要なキーと値を含む .env ファイルを作成してください。"
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

foreach ($secret in $secretsToDeploy.GetEnumerator()) {
    $secretName = $secret.Name
    $secretValue = $secret.Value
    Write-Host "  - 処理中のシークレット: $secretName"

    # 期待される 'not found' エラーでスクリプトが停止しないように、エラーハンドリングを一時的に変更
    $oldErrorAction = $ErrorActionPreference
    $ErrorActionPreference = "SilentlyContinue"

    gcloud secrets describe $secretName --project $GCP_PROJECT_ID --quiet --format="value(name)" 2>$null
    $secretExists = $? # $? は、直前のコマンドが成功した場合は $true、失敗した場合は $false

    $ErrorActionPreference = $oldErrorAction # 元のエラーハンドリングに戻す

    if ($secretExists) {
        Write-Host "    -> 既存のシークレットを更新します。"
        # PowerShellでパイプからgcloudに渡す場合、エンコーディングの問題を避けるために一時ファイルを使うのが最も堅牢です
        $tempFile = [System.IO.Path]::GetTempFileName()
        Set-Content -Path $tempFile -Value $secretValue -AsByteStream -NoNewline
        gcloud secrets versions add $secretName --data-file=$tempFile --project $GCP_PROJECT_ID --quiet
        Remove-Item $tempFile -Force
        if (-not $?) {
            Write-Host "${RED}エラー: シークレット '$secretName' の更新に失敗しました。${NC}"
            exit 1
        }
    } else {
        Write-Host "    -> 新しいシークレットを作成します。"
        $tempFile = [System.IO.Path]::GetTempFileName()
        Set-Content -Path $tempFile -Value $secretValue -AsByteStream -NoNewline
        gcloud secrets create $secretName --data-file=$tempFile --replication-policy=automatic --project $GCP_PROJECT_ID --quiet
        Remove-Item $tempFile -Force
        if (-not $?) {
            Write-Host "${RED}エラー: シークレット '$secretName' の作成に失敗しました。${NC}"
            Write-Host "エラーメッセージを確認し、APIが有効になっているか、または権限が正しいか確認してください。"
            exit 1
        }
    }
}
Write-Host "✅ Secret Managerへの登録/更新が完了しました。"

# --- 4. Cloud Buildでコンテナイメージをビルド ---
Write-Host "`n${YELLOW}4. Cloud Buildを使用してコンテナイメージをビルドします...${NC}"
$IMAGE_URI = "${REGION}-docker.pkg.dev/${GCP_PROJECT_ID}/cloud-run-source-deploy/${SERVICE_NAME}:latest"
gcloud builds submit . --tag "$IMAGE_URI" --ignore-file=.gcloudignore --project $GCP_PROJECT_ID --quiet
Write-Host "✅ コンテナイメージのビルドが完了しました: $IMAGE_URI"

# --- 5. Cloud Runへデプロイ ---
Write-Host "`n${YELLOW}5. Cloud Runにサービスをデプロイします...${NC}"
# --set-secrets でSecret Managerから値を環境変数として設定します
# GOOGLE_APPLICATION_CREDENTIALSを空にすることで、サービスアカウントの権限が自動で使われます

$setSecretsArg = ($secretsToDeploy.Keys | ForEach-Object { "$_=$_:latest" }) -join ','

gcloud run deploy "$SERVICE_NAME" `
    --image "$IMAGE_URI" `
    --region "$REGION" `
    --platform "managed" `
    --no-allow-unauthenticated `
    --service-account="$SERVICE_ACCOUNT_EMAIL" `
    --set-secrets="$setSecretsArg" `
    --set-env-vars="GCS_BUCKET_NAME=${GCS_BUCKET_NAME},GOOGLE_APPLICATION_CREDENTIALS=" `
    --quiet

Write-Host "`n${GREEN}✅ デプロイが正常に完了しました！${NC}"

# --- 後続作業の案内 ---
$line = "----------------------------------------"
$secretRole = "'Secret Manager のシークレット アクセサー'"
$storageRole = "'ストレージ オブジェクト管理者'"

Write-Host $line
Write-Host "💡 IAM権限に関する重要事項:"
Write-Host "1. ${YELLOW}Cloud Run サービスに紐付くサービスアカウント${NC}に以下のIAMロールが必要です:"
Write-Host "   - $secretRole (シークレットを読み取るため)"
Write-Host "   - $storageRole (GCSバケットに読み書きするため)"
Write-Host "2. Discordスラッシュコマンド登録(devcmd.js)は、別途Cloud Run Jobs等で実行することを推奨します。"
Write-Host $line
Write-Host "🔧 Botの動作状況はCloud Loggingで確認できます:"
Write-Host "   https://console.cloud.google.com/logs/viewer"
Write-Host $line