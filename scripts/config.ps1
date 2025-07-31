<#
.SYNOPSIS
    Central configuration for all deployment and job scripts.
    This file is intended to be sourced by other PowerShell scripts.
#>
$GCP_PROJECT_ID        = "legion-bot-466619"
$SERVICE_NAME          = "legion-kanri-bot"
$REGION                = "asia-northeast1"
$GCS_BUCKET_NAME       = "data-quest"

# Service Account configuration
$SERVICE_ACCOUNT_NAME          = "legion-bot-sa"
$SERVICE_ACCOUNT_DISPLAY_NAME  = "Legion Bot Service Account"
$SERVICE_ACCOUNT_EMAIL         = "${SERVICE_ACCOUNT_NAME}@${GCP_PROJECT_ID}.iam.gserviceaccount.com"

# Cloud Run Job configuration
$JOB_NAME                      = "${SERVICE_NAME}-register-commands"