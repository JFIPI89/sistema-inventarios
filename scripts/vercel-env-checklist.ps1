# Print Vercel env vars checklist (values from local .env — do not commit)
# Usage: .\scripts\vercel-env-checklist.ps1

$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot\..

if (-not (Test-Path .env)) {
    Write-Host "Create .env first (copy from .env.example)"
    exit 1
}

Get-Content .env | ForEach-Object {
    if ($_ -match '^(DATABASE_URL|DIRECT_URL|AUTH_SECRET|CURRENCY_SYMBOL|CURRENCY_CODE)=') {
        $name = $_.Split('=')[0]
        Write-Host "[ ] $name — copy to Vercel Production env"
    }
}

Write-Host ""
Write-Host "Vercel dashboard: https://vercel.com/new"
Write-Host "Use a NEW AUTH_SECRET for production (not the dev one)."
Write-Host "See DEPLOY.md for full steps."
