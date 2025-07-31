# PowerShellスクリプトとして実行します
# Bot専用のサービスアカウントを作成し、最小権限を付与します。
$ErrorActionPreference = "Stop"

# --- 色付け用 ---
$GREEN = "`e[32m"
$YELLOW = "`e[93m"
$RED = "`e[31m"
$NC = "`e[0m"

Write-Host "${GREEN}--- Bot専用サービスアカウント セットアップスクリプト ---${NC}"
# --- 1. 共通設定の読み込み ---
. ".\scripts\config.ps1"

# --- 2. サービスアカウントを作成 ---
Write-Host "`n${YELLOW}1. サービスアカウント '$SERVICE_ACCOUNT_NAME' を作成しています...${NC}"

Write-Host "    -> サービスアカウントの存在を確認しています..."
# Temporarily change the error preference to prevent the script from stopping on the expected 'not found' error.
$oldErrorAction = $ErrorActionPreference
$ErrorActionPreference = "SilentlyContinue"

# Attempt to describe the service account.
gcloud iam service-accounts describe $SERVICE_ACCOUNT_EMAIL --project $GCP_PROJECT_ID --quiet 2>$null
$saExists = $? # $? is $true if the last command succeeded (SA exists), $false if it failed (SA does not exist).

# Restore the original error preference.
$ErrorActionPreference = $oldErrorAction

if ($saExists) {
    Write-Host "✅ サービスアカウントは既に存在します: $SERVICE_ACCOUNT_EMAIL"
} else {
    Write-Host "    -> サービスアカウントが見つからないため、新規作成します。"
    gcloud iam service-accounts create $SERVICE_ACCOUNT_NAME `
        --project=$GCP_PROJECT_ID `
        --display-name="$SERVICE_ACCOUNT_DISPLAY_NAME"
    Write-Host "✅ 新しいサービスアカウントを作成しました: $SERVICE_ACCOUNT_EMAIL"
}

# --- 3. 必要なIAMロールを付与 ---
Write-Host "`n${YELLOW}2. サービスアカウントに必要なIAMロールを付与します...${NC}"
$rolesToGrant = @{
    "roles/secretmanager.secretAccessor" = "Secret Manager のシークレット アクセサー";
    "roles/storage.objectAdmin"          = "ストレージ オブジェクト管理者";
}

foreach ($role in $rolesToGrant.GetEnumerator()) {
    $roleName = $role.Name
    $roleDescription = $role.Value
    Write-Host "  - 付与するロール: $roleDescription ($roleName)"
    gcloud projects add-iam-policy-binding $GCP_PROJECT_ID `
        --member="serviceAccount:$SERVICE_ACCOUNT_EMAIL" `
        --role="$roleName" `
        --quiet
}

Write-Host "`n${YELLOW}3. Cloud Buildサービスアカウントに権限を付与します...${NC}"
$PROJECT_NUMBER = (gcloud projects describe $GCP_PROJECT_ID --format="value(projectNumber)")
$CLOUDBUILD_SA_EMAIL = "${PROJECT_NUMBER}@cloudbuild.gserviceaccount.com"
$buildRole = "roles/artifactregistry.writer"
$buildRoleDescription = "Artifact Registry Writer (ビルドしたイメージをプッシュするため)"

Write-Host "  - 対象: $CLOUDBUILD_SA_EMAIL"
Write-Host "  - 付与するロール: $buildRoleDescription ($buildRole)"

gcloud projects add-iam-policy-binding $GCP_PROJECT_ID `
    --member="serviceAccount:$CLOUDBUILD_SA_EMAIL" `
    --role="$buildRole" `
    --quiet

Write-Host "`n${GREEN}✅ セットアップが正常に完了しました。${NC}"
Write-Host "次回からデプロイ時にこの専用サービスアカウントが使用されます。"