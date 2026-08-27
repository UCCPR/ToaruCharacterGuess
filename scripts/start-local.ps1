$ErrorActionPreference = 'Stop'

$repoRoot = Split-Path -Parent $PSScriptRoot
$portableNode = Join-Path $repoRoot '.tools\node-v26.7.0-win-x64\node.exe'
$serverEntry = Join-Path $repoRoot 'server\dist\index.js'

if (-not (Test-Path -LiteralPath $portableNode)) {
  throw 'Portable Node 26 was not found under .tools.'
}

if (-not (Test-Path -LiteralPath $serverEntry)) {
  throw 'The server build was not found. Run the server build first.'
}

Set-Location -LiteralPath $repoRoot
& $portableNode $serverEntry
