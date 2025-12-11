<# 
    git-auto-push.ps1
    Automatically add, commit, and push changes for the repo that this script lives in.
#>

# Ensure we’re running from the script's directory
Set-Location -Path $PSScriptRoot

Write-Host "Working directory: $(Get-Location)" -ForegroundColor Cyan

# 1. Check that git is installed
git --version *> $null
if ($LASTEXITCODE -ne 0) {
    Write-Host "Error: Git is not installed or not available in PATH." -ForegroundColor Red
    exit 1
}

# 2. Check that this folder is inside a git repository
git rev-parse --is-inside-work-tree *> $null
if ($LASTEXITCODE -ne 0) {
    Write-Host "Error: This directory is not inside a Git repository." -ForegroundColor Red
    exit 1
}

# 3. Check if there are any changes to commit
$changes = git status --porcelain
if (-not $changes) {
    Write-Host "No changes detected. Nothing to commit or push." -ForegroundColor Yellow
    exit 0
}

Write-Host "Changes detected:" -ForegroundColor Green
$changes

# 4. Ask for commit message
$commitMessage = Read-Host "Enter commit message"
if ([string]::IsNullOrWhiteSpace($commitMessage)) {
    $commitMessage = "Auto commit from git-auto-push script"
}

# 5. git add .
Write-Host "`nRunning: git add ."
git add .
if ($LASTEXITCODE -ne 0) {
    Write-Host "Error during 'git add .'" -ForegroundColor Red
    exit 1
}

# 6. git commit -m "message"
Write-Host "Running: git commit -m `"$commitMessage`""
git commit -m "$commitMessage"
if ($LASTEXITCODE -ne 0) {
    Write-Host "Error during 'git commit'. (Possibly nothing to commit.)" -ForegroundColor Red
    exit 1
}

# 7. git push
Write-Host "Running: git push"
git push
if ($LASTEXITCODE -ne 0) {
    Write-Host "Error during 'git push'. Check your remote / auth settings." -ForegroundColor Red
    exit 1
}

Write-Host "`nDone. Changes committed and pushed successfully." -ForegroundColor Green
