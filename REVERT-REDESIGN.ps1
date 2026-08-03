# One-click revert of the 2026-08-04 marketing redesign.
#
# Restores every touched file to its exact pre-redesign content from the
# snapshot taken before any edit, and deletes the components the redesign
# added. Safe to run more than once.
#
#   .\REVERT-REDESIGN.ps1

$ErrorActionPreference = 'Stop'
$snap = 'D:\tmp\teen-temp\claude\D--51-gainingdocx\fe9c700a-8a51-483e-bd06-701705374689\scratchpad\pre-redesign-snapshot'
$root = $PSScriptRoot

if (-not (Test-Path $snap)) {
  Write-Host "Snapshot missing at:" -ForegroundColor Red
  Write-Host "  $snap"
  Write-Host ""
  Write-Host "Git fallback (discards ALL uncommitted work in these paths):" -ForegroundColor Yellow
  Write-Host "  git checkout -- app/globals.css 'app/(marketing)' components/ui components/marketing"
  exit 1
}

# 1. Restore every file captured in the snapshot, preserving its relative path.
$restored = 0
Get-ChildItem -LiteralPath $snap -Recurse -File | ForEach-Object {
  $rel = $_.FullName.Substring($snap.Length).TrimStart('\')
  $dst = Join-Path $root $rel
  $dstDir = Split-Path $dst -Parent
  if (-not (Test-Path $dstDir)) { New-Item -ItemType Directory -Force -Path $dstDir | Out-Null }
  Copy-Item -LiteralPath $_.FullName -Destination $dst -Force
  Write-Host "restored  $rel" -ForegroundColor Green
  $restored++
}

# 2. Remove files the redesign introduced (not present in the snapshot).
$added = @(
  'components\marketing\mode-finder.tsx',
  'components\marketing\doc-chain.tsx'
)
foreach ($rel in $added) {
  $p = Join-Path $root $rel
  if (Test-Path $p) {
    Remove-Item -LiteralPath $p -Force
    Write-Host "removed   $rel" -ForegroundColor Yellow
  }
}

Write-Host ""
Write-Host "Reverted $restored file(s). Restart the dev server to see the original site." -ForegroundColor Cyan
Write-Host "(The dev server hot-reloads, so usually just refresh the browser.)" -ForegroundColor DarkGray
