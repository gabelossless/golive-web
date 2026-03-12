$ErrorActionPreference = 'SilentlyContinue'

$vars = [ordered]@{
    'NEXT_PUBLIC_SUPABASE_URL'      = 'https://puhrqtwakabyvagnvcch.supabase.co'
    'NEXT_PUBLIC_SUPABASE_ANON_KEY' = 'sb_publishable_gID2hTOmFG-UkyWLQdlBsQ_LiX9O1mK'
    'R2_ACCOUNT_ID'                 = '233bc538f73403cc7a658941e7cfab88'
    'R2_ACCESS_KEY_ID'              = 'b18aac9338768806542dc69c3346953b'
    'R2_SECRET_ACCESS_KEY'          = '9f86843592b540de8d69a356fb7859f9d03f6d9ebb4ab163551a6ec6132719b3'
    'R2_BUCKET_NAME'                = 'golive-media'
    'NEXT_PUBLIC_R2_PUBLIC_URL'     = 'https://pub-3460ade86c9d4018be04f796bad3ff79.r2.dev'
}

$environments = @('production', 'preview', 'development')

foreach ($environment in $environments) {
    foreach ($key in $vars.Keys) {
        $value = $vars[$key]
        Write-Host "Setting $key for $environment ..."
        $value | vercel env add $key $environment 2>&1
        Write-Host "  Done: $key"
    }
}

Write-Host ""
Write-Host "All environment variables set!" -ForegroundColor Green
