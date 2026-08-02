<#
.SYNOPSIS
    Exports, transfers, and loads the Meal Planner Docker image to Unraid.
.DESCRIPTION
    Automates the deployment workflow:
      1. Exports the Docker image to a .tar file
      2. Transfers it to the Unraid server via SCP
      3. Loads the image on Unraid via SSH
      4. Optionally restarts the container

    Can also be used in export-only mode for manual transfer.
.EXAMPLE
    .\scripts\update-unraid.ps1
    .\scripts\update-unraid.ps1 -ExportOnly
    .\scripts\update-unraid.ps1 -UnraidHost 192.168.1.50 -UnraidUser root
    .\scripts\update-unraid.ps1 -UnraidHost 192.168.1.50 -Cleanup
#>

param(
    [string]$UnraidHost = "",
    [string]$UnraidUser = "root",
    [string]$UnraidPath = "/mnt/user/appdata/meal-planner",
    [switch]$ExportOnly = $false,
    [switch]$SkipExport = $false,
    [switch]$RestartContainer = $false,
    [switch]$Cleanup = $false
)

$ErrorActionPreference = "Stop"

# ── Resolve project root ──────────────────────────────────────────────────────
$ProjectRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$EnvFile     = Join-Path $ProjectRoot ".env.docker"
$VersionFile = Join-Path $ProjectRoot "VERSION"

# ── Read version ──────────────────────────────────────────────────────────────
if (Test-Path $VersionFile) {
    $version = (Get-Content $VersionFile -Raw).Trim()
} else {
    $version = "0.1.0"
    Write-Warning "VERSION file not found, defaulting to: $version"
}

# ── Read image name from .env.docker ──────────────────────────────────────────
$imageName = "meal-planner"
$imageTag = "latest"

if (Test-Path $EnvFile) {
    Get-Content $EnvFile | ForEach-Object {
        $line = $_.Trim()
        if ($line -match '^\s*#' -or $line -match '^\s*$') { return }
        if ($line -match '^DOCKER_IMAGE_NAME=(.+)$') {
            $imageName = $Matches[1].Trim() -replace '^"(.*)"$', '$1' -replace "^'(.*)'$", '$1'
        }
        if ($line -match '^DOCKER_IMAGE_TAG=(.+)$') {
            $imageTag = $Matches[1].Trim() -replace '^"(.*)"$', '$1' -replace "^'(.*)'$", '$1'
        }
    }
}

$fullImageName = "${imageName}:${imageTag}"
$tarFileName = "meal-planner-v${version}.tar"

# ── Step 1: Export image ──────────────────────────────────────────────────────
if (-not $SkipExport) {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host " Step 1: Exporting Docker image" -ForegroundColor Cyan
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Image: $fullImageName" -ForegroundColor White
    Write-Host "Output: $tarFileName" -ForegroundColor White
    Write-Host ""

    # Check if image exists
    $imageCheck = docker image inspect $fullImageName 2>$null
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Docker image '$fullImageName' not found. Run '.\scripts\build.ps1' first."
        exit 1
    }

    docker save -o $tarFileName $fullImageName

    if ($LASTEXITCODE -ne 0) {
        Write-Error "Failed to export Docker image."
        exit $LASTEXITCODE
    }

    $fileSize = (Get-Item $tarFileName).Length / 1MB
    Write-Host ""
    Write-Host "Export complete! File size: $([math]::Round($fileSize, 1)) MB" -ForegroundColor Green
    Write-Host ""

    if ($ExportOnly) {
        Write-Host "Export-only mode. File saved to: $tarFileName" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "Manual transfer steps:" -ForegroundColor Yellow
        Write-Host "  1. Copy to Unraid:   scp $tarFileName ${UnraidUser}@${UnraidHost}:/tmp/" -ForegroundColor White
        Write-Host "  2. SSH into Unraid:  ssh ${UnraidUser}@${UnraidHost}" -ForegroundColor White
        Write-Host "  3. Load image:       docker load -i /tmp/$tarFileName" -ForegroundColor White
        Write-Host "  4. Restart container via Unraid web UI" -ForegroundColor White
        Write-Host ""
        exit 0
    }
}

# ── Step 2: Transfer to Unraid ────────────────────────────────────────────────
if ([string]::IsNullOrWhiteSpace($UnraidHost)) {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Yellow
    Write-Host " Unraid host not specified!" -ForegroundColor Yellow
    Write-Host "========================================" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Set -UnraidHost parameter or run in export-only mode:" -ForegroundColor White
    Write-Host "  .\scripts\update-unraid.ps1 -ExportOnly" -ForegroundColor White
    Write-Host "  .\scripts\update-unraid.ps1 -UnraidHost 192.168.1.50" -ForegroundColor White
    Write-Host ""
    Write-Host "Manual steps:" -ForegroundColor White
    Write-Host "  1. scp $tarFileName root@<unraid-ip>:/tmp/" -ForegroundColor White
    Write-Host "  2. ssh root@<unraid-ip>" -ForegroundColor White
    Write-Host "  3. docker load -i /tmp/$tarFileName" -ForegroundColor White
    Write-Host "  4. Restart container via Unraid web UI" -ForegroundColor White
    Write-Host ""
    exit 0
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host " Step 2: Transferring to Unraid" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Transferring to ${UnraidUser}@${UnraidHost}:/tmp/..." -ForegroundColor White
Write-Host ""

scp $tarFileName "${UnraidUser}@${UnraidHost}:/tmp/"

if ($LASTEXITCODE -ne 0) {
    Write-Error "SCP transfer failed. Check network connectivity and SSH key setup."
    exit $LASTEXITCODE
}

Write-Host ""
Write-Host "Transfer complete!" -ForegroundColor Green
Write-Host ""

# ── Step 3: Load image on Unraid ─────────────────────────────────────────────
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host " Step 3: Loading image on Unraid" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

ssh "${UnraidUser}@${UnraidHost}" "docker load -i /tmp/$tarFileName && rm /tmp/$tarFileName"

if ($LASTEXITCODE -ne 0) {
    Write-Error "Failed to load image on Unraid. Try manually via SSH."
    exit $LASTEXITCODE
}

Write-Host ""
Write-Host "Image loaded successfully on Unraid!" -ForegroundColor Green
Write-Host ""

# ── Step 4: Restart container (optional) ─────────────────────────────────────
if ($RestartContainer) {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host " Step 4: Restarting container" -ForegroundColor Cyan
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""

    # The Unraid deployment is managed by docker-compose, not a bare `docker run`
    # container — `docker restart` only restarts the EXISTING container on its
    # OLD image; it does not pick up a freshly `docker load`-ed image. We must
    # recreate the container via `docker compose up -d` in its project directory.
    $composeDir = '/mnt/user/appdata/forkast'
    $recreateCmd = "cd $composeDir && docker compose up -d"
    ssh "${UnraidUser}@${UnraidHost}" $recreateCmd

    if ($LASTEXITCODE -ne 0) {
        Write-Warning "Could not automatically recreate the container. Run manually: ssh ${UnraidUser}@${UnraidHost} 'cd $composeDir && docker compose up -d'"
    } else {
        Write-Host "Container recreated from the new image via docker compose." -ForegroundColor Green
    }
}

# ── Step 5: Cleanup local .tar file ───────────────────────────────────────────
if ($Cleanup -and -not $SkipExport -and (Test-Path $tarFileName)) {
    Remove-Item $tarFileName -Force
    Write-Host "Cleaned up local .tar file: $tarFileName" -ForegroundColor Green
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host " Deployment complete!" -ForegroundColor Green
Write-Host " Version: v${version}" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Health check:" -ForegroundColor Yellow
Write-Host "  curl http://<unraid-ip>:3000/api/health" -ForegroundColor White
Write-Host ""
