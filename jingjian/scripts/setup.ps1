$ErrorActionPreference = 'Stop'

$nodeVersion = node --version
$nodeMajor = [int](($nodeVersion -replace '^v', '').Split('.')[0])
if ($nodeMajor -lt 22) {
  throw "Node.js 22 or newer is required. Current version: $nodeVersion"
}

npm ci

if (-not (Test-Path '.env') -and (Test-Path '.env.example')) {
  Copy-Item '.env.example' '.env'
  Write-Host 'Created .env from .env.example. Add provider credentials only when running the pipeline.'
}

npm run build
Write-Host 'Jingjian is ready. Run: npm run dev'
