$projectDir = "E:\IMP FILES\Documents\fadil\fedex"
$distDir = "E:\IMP FILES\Documents\fadil\fedex-dist"
$zipPath = "E:\IMP FILES\Documents\fadil\fedex-vercel-deployment.zip"

Write-Host "Preparing clean staging directory..."
if (Test-Path $distDir) { Remove-Item $distDir -Recurse -Force }
if (Test-Path $zipPath) { Remove-Item $zipPath -Force }

New-Item -ItemType Directory -Path $distDir -Force | Out-Null

$itemsToCopy = @(
    "app",
    "components",
    "lib",
    "models",
    "public",
    "scripts",
    "package.json",
    "package-lock.json",
    "tsconfig.json",
    "tailwind.config.ts",
    "postcss.config.mjs",
    "next.config.mjs",
    ".eslintrc.json",
    ".gitignore",
    ".env.example",
    "README.md"
)

foreach ($item in $itemsToCopy) {
    $src = Join-Path $projectDir $item
    if (Test-Path $src) {
        Copy-Item -Path $src -Destination $distDir -Recurse -Force
        Write-Host " Copied: $item"
    }
}

Write-Host "Compressing $distDir into $zipPath..."
Compress-Archive -Path "$distDir\*" -DestinationPath $zipPath -CompressionLevel Optimal -Force

Remove-Item $distDir -Recurse -Force

if (Test-Path $zipPath) {
    $zipItem = Get-Item $zipPath
    $sizeKB = [math]::Round($zipItem.Length / 1KB, 2)
    Write-Host "=========================================="
    Write-Host " SUCCESS: $zipPath"
    Write-Host " Size: $sizeKB KB"
    Write-Host "=========================================="
} else {
    Write-Error "Failed to create ZIP archive."
}
