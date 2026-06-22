# Push to GitHub (run after creating empty repo on github.com)
# Usage: .\scripts\push-github.ps1 -GitHubUser YOUR_USERNAME -RepoName sistema-inventarios

param(
    [string]$GitHubUser = "JFIPI89",
    [string]$RepoName = "sistema-inventarios"
)

$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot\..

if (Test-Path .env) {
    $tracked = git ls-files --error-unmatch .env 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Error ".env is tracked by git — remove it before pushing"
        exit 1
    }
}

git branch -M main 2>$null
$remote = "https://github.com/$GitHubUser/$RepoName.git"

if (-not (git remote get-url origin 2>$null)) {
    git remote add origin $remote
} else {
    git remote set-url origin $remote
}

Write-Host "Pushing to $remote ..."
git push -u origin main
Write-Host "Done. Next: import repo at https://vercel.com/new"
