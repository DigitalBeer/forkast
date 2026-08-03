<#
.SYNOPSIS
    Push pending Supabase migrations to the remote project.
.DESCRIPTION
    Runs `supabase db push` to apply any local migrations that have not yet
    been executed on the linked remote Supabase project.

    Use this when you see 500 errors on API routes that query recently-added
    columns (e.g. /api/profile/preferences failing because dietary_preferences,
    disliked_ingredients, meal_type_preferences, or onboarding_completed are
    missing from the remote profiles table).
.EXAMPLE
    .\scripts\push-supabase-migrations.ps1
#>

$ErrorActionPreference = "Stop"

# ── Resolve project root ──────────────────────────────────────────────────────
$ProjectRoot = Resolve-Path (Join-Path $PSScriptRoot "..")

# ── Verify supabase CLI is installed ──────────────────────────────────────────
if (-not (Get-Command supabase -ErrorAction SilentlyContinue)) {
    Write-Error @"
supabase CLI not found.

Install it with:
  npm install -g supabase

Or download from: https://github.com/supabase/cli/releases
"@
    exit 1
}

# ── Verify linked project ─────────────────────────────────────────────────────
Push-Location $ProjectRoot

try {
    $status = supabase status 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Error @"
Supabase project is not linked.

Run: supabase login
Then: supabase link --project-ref <your-project-ref>
"@
        exit 1
    }

    Write-Host "Pushing pending migrations to remote Supabase..." -ForegroundColor Cyan
    supabase db push

    if ($LASTEXITCODE -eq 0) {
        Write-Host "`nMigrations pushed successfully." -ForegroundColor Green
    } else {
        Write-Error "Migration push failed with exit code $LASTEXITCODE"
    }
} finally {
    Pop-Location
}
