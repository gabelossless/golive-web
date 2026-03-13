const { execSync } = require('child_process');

const vars = {
    'NEXT_PUBLIC_SUPABASE_URL': 'https://puhrqtwakabyvagnvcch.supabase.co',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY': 'sb_publishable_gID2hTOmFG-UkyWLQdlBsQ_LiX9O1mK',
    'R2_ACCOUNT_ID': '233bc538f73403cc7a658941e7cfab88',
    'R2_ACCESS_KEY_ID': 'b18aac9338768806542dc69c3346953b',
    'R2_SECRET_ACCESS_KEY': '9f86843592b540de8d69a356fb7859f9d03f6d9ebb4ab163551a6ec6132719b3',
    'R2_BUCKET_NAME': 'golive-media',
    'NEXT_PUBLIC_R2_PUBLIC_URL': 'https://pub-3460ade86c9d4018be04f796bad3ff79.r2.dev'
};

const envs = ['production', 'preview', 'development'];

for (const [k, v] of Object.entries(vars)) {
    for (const env of envs) {
        try { 
            execSync(`vercel env rm ${k} ${env} -y`, {stdio: 'ignore'}); 
        } catch(e) {}
        
        console.log(`Setting ${k} for ${env}`);
        try {
            execSync(`vercel env add ${k} ${env}`, { input: v, stdio: ['pipe', 'ignore', 'ignore'] });
        } catch(e) {
            console.error(`Failed to set ${k} for ${env}`);
        }
    }
}

console.log('Deploying to production...');
execSync('vercel --prod --yes', {stdio: 'inherit'});
console.log('Deployment complete.');
