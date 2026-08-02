<#
.SYNOPSIS
    One-command build script for the Meal Planner Docker image.
.DESCRIPTION
    Reads .env.docker for build arguments, validates them, and builds a
    Docker image tagged with the version from VERSION file.
    Supports --no-cache flag for fresh builds.
.EXAMPLE
    .\scripts\build.ps1
    .\scripts\build.ps1 -NoCache
#>

param(
    [switch]$NoCache = $false,
    [switch]$Local = $false
)

$ErrorActionPreference = "Stop"

# ── Resolve project root ──────────────────────────────────────────────────────
$ProjectRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$EnvFile     = Join-Path $ProjectRoot ".env.docker"
$VersionFile = Join-Path $ProjectRoot "VERSION"

# ── Ensure .env.docker exists ─────────────────────────────────────────────────
if (-not (Test-Path $EnvFile)) {
    Write-Error @"
.env.docker not found at: $EnvFile

Copy .env.docker.example to .env.docker and fill in your values:
  copy .env.docker.example .env.docker
"@
    exit 1
}

# ── Read .env.docker ─────────────────────────────────────────────────────────
Write-Host "Reading .env.docker..." -ForegroundColor Cyan
$envVars = @{}
$localOverrides = @{}
Get-Content $EnvFile | ForEach-Object {
    $line = $_.Trim()
    # Skip comments and empty lines
    if ($line -match '^\s*#' -or $line -match '^\s*$') { return }
    if ($line -match '^([^=]+)=(.*)$') {
        $key = $Matches[1].Trim()
        $val = $Matches[2].Trim()
        # Strip surrounding quotes
        $val = $val -replace '^"(.*)"$', '$1' -replace "^'(.*)'$", '$1'
        $envVars[$key] = $val
    }
}

# ── Read optional .env.docker.local ───────────────────────────────────────────
$EnvLocalFile = Join-Path $ProjectRoot ".env.docker.local"
if (Test-Path $EnvLocalFile) {
    Write-Host "Reading .env.docker.local overrides..." -ForegroundColor Cyan
    Get-Content $EnvLocalFile | ForEach-Object {
        $line = $_.Trim()
        if ($line -match '^\s*#' -or $line -match '^\s*$') { return }
        if ($line -match '^([^=]+)=(.*)$') {
            $key = $Matches[1].Trim()
            $val = $Matches[2].Trim()
            $val = $val -replace '^"(.*)"$', '$1' -replace "^'(.*)'$", '$1'
            $localOverrides[$key] = $val
        }
    }
}

# ── Apply local overrides ─────────────────────────────────────────────────────
if ($Local) {
    Write-Host "`n========================================" -ForegroundColor Yellow
    Write-Host " LOCAL BUILD MODE ENABLED " -ForegroundColor Yellow
    Write-Host "========================================" -ForegroundColor Yellow
    Write-Host "Overriding NEXT_PUBLIC_APP_URL to http://localhost:3000" -ForegroundColor Yellow
    Write-Host "Auth cookies will work correctly over plain HTTP." -ForegroundColor Yellow
    Write-Host "DO NOT deploy this image to Unraid — rebuild without -Local." -ForegroundColor Yellow
    Write-Host "========================================`n" -ForegroundColor Yellow
    $envVars['NEXT_PUBLIC_APP_URL'] = 'http://localhost:3000'
} elseif ($localOverrides.ContainsKey('NEXT_PUBLIC_APP_URL')) {
    Write-Host "Applying NEXT_PUBLIC_APP_URL override from .env.docker.local" -ForegroundColor Cyan
    $envVars['NEXT_PUBLIC_APP_URL'] = $localOverrides['NEXT_PUBLIC_APP_URL']
}

# ── Required build-time variables ─────────────────────────────────────────────
$requiredBuildArgs = @(
    @{ name = 'NEXT_PUBLIC_SUPABASE_URL';  validateUrl = $true  }
    @{ name = 'NEXT_PUBLIC_SUPABASE_ANON_KEY'; validateUrl = $false }
    @{ name = 'NEXT_PUBLIC_APP_URL';        validateUrl = $true  }
)

# Optional build-time variables (can be empty)
$optionalBuildArgs = @(
    @{ name = 'NEXT_PUBLIC_SENTRY_DSN'; validateUrl = $false }
)

# ── Read version ─────────────────────────────────────────────────────────────
if (Test-Path $VersionFile) {
    $version = (Get-Content $VersionFile -Raw).Trim()
    Write-Host "Building version: $version" -ForegroundColor Cyan
} else {
    $version = "0.1.0"
    Write-Host "VERSION file not found, defaulting to: $version" -ForegroundColor Yellow
}

# ── Validate required build args ──────────────────────────────────────────────
$missing = @()
foreach ($argSpec in $requiredBuildArgs) {
    $arg = $argSpec.name
    if (-not $envVars.ContainsKey($arg) -or [string]::IsNullOrWhiteSpace($envVars[$arg])) {
        $missing += $arg
    }
}

if ($missing.Count -gt 0) {
    Write-Error @"
Missing required build arguments:

$($missing | ForEach-Object { "  - $_" } | Join-String "`n")

Ensure these are set in .env.docker before building.
"@
    exit 1
}

# ── Validate URL format ───────────────────────────────────────────────────────
foreach ($argSpec in $requiredBuildArgs) {
    if ($argSpec.validateUrl) {
        $url = $envVars[$argSpec.name]
        if ($url -notmatch '^https?://') {
            Write-Error "$($argSpec.name) must be a valid HTTP(S) URL: $url"
            exit 1
        }
    }
}

# Validate Supabase URL specifically
if ($envVars['NEXT_PUBLIC_SUPABASE_URL'] -notmatch '^https?://.+\.supabase\.co') {
    Write-Warning "NEXT_PUBLIC_SUPABASE_URL doesn't look like a valid Supabase URL: $($envVars['NEXT_PUBLIC_SUPABASE_URL'])"
}

# Validate NEXT_PUBLIC_APP_URL specifically
if ($envVars['NEXT_PUBLIC_APP_URL'] -notmatch '^https?://') {
    Write-Error "NEXT_PUBLIC_APP_URL must be a valid HTTP(S) URL: $($envVars['NEXT_PUBLIC_APP_URL'])"
    exit 1
}

# Warn if building for local with non-local URL (common mistake)
if (-not $Local -and $envVars['NEXT_PUBLIC_APP_URL'] -match 'localhost|127\.0\.0\.1') {
    Write-Warning "NEXT_PUBLIC_APP_URL points to localhost ($($envVars['NEXT_PUBLIC_APP_URL'])). Use -Local switch for intentional local builds."
}

# ── Build docker command ──────────────────────────────────────────────────────
$imageName = if ($envVars.ContainsKey('DOCKER_IMAGE_NAME')) { $envVars['DOCKER_IMAGE_NAME'] } else { 'meal-planner' }
$imageTag = if ($envVars.ContainsKey('DOCKER_IMAGE_TAG')) { $envVars['DOCKER_IMAGE_TAG'] } else { 'latest' }

# Tag with version as well
$versionTag = "${imageName}:${version}"

# Collect all build arguments dynamically
$buildArgList = @(
    "NEXT_PUBLIC_SUPABASE_URL=$($envVars['NEXT_PUBLIC_SUPABASE_URL'])"
    "NEXT_PUBLIC_SUPABASE_ANON_KEY=$($envVars['NEXT_PUBLIC_SUPABASE_ANON_KEY'])"
    "NEXT_PUBLIC_APP_URL=$($envVars['NEXT_PUBLIC_APP_URL'])"
    "NEXT_PUBLIC_APP_VERSION=$version"
)

# Add optional args if present
foreach ($argSpec in $optionalBuildArgs) {
    $name = $argSpec.name
    if ($envVars.ContainsKey($name) -and -not [string]::IsNullOrWhiteSpace($envVars[$name])) {
        $buildArgList += "$name=$($envVars[$name])"
    }
}

# Assemble docker arguments using a list — avoids hardcoded indices
$dockerArgs = @("build")
if ($NoCache) {
    $dockerArgs += "--no-cache"
}

foreach ($ba in $buildArgList) {
    $dockerArgs += @("--build-arg", $ba)
}

$dockerArgs += @("-t", "${imageName}:${imageTag}")
$dockerArgs += @("-t", $versionTag)
$dockerArgs += $ProjectRoot

# ── Execute build ─────────────────────────────────────────────────────────────
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host " Building Docker image: ${imageName}:${imageTag}" -ForegroundColor Cyan
Write-Host " Version tag: ${versionTag}" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

& docker $dockerArgs

if ($LASTEXITCODE -ne 0) {
    Write-Error "Docker build failed with exit code $LASTEXITCODE"
    exit $LASTEXITCODE
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host " Build successful!" -ForegroundColor Green
Write-Host " Image: ${imageName}:${imageTag}" -ForegroundColor Green
Write-Host " Image: ${versionTag}" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
if ($Local) {
    Write-Host "Next steps:" -ForegroundColor Yellow
    Write-Host "  1. Test locally:  docker compose --env-file .env.docker up" -ForegroundColor White
    Write-Host "  2. When ready for Unraid:  .\scripts\build.ps1 (without -Local)" -ForegroundColor White
    Write-Host ""
} else {
    Write-Host "Next steps:" -ForegroundColor Yellow
    Write-Host "  1. Test locally:  docker compose --env-file .env.docker up" -ForegroundColor White
    Write-Host "     (Use -Local if auth redirects are an issue over HTTP)" -ForegroundColor DarkGray
    Write-Host "  2. Export image:  .\scripts\update-unraid.ps1 -ExportOnly" -ForegroundColor White
    Write-Host "  3. Deploy:        .\scripts\update-unraid.ps1" -ForegroundColor White
    Write-Host ""
}
