const https = require('https');
const crypto = require('crypto');

async function testUpload() {
    console.log('1. Requesting presigned URL from API...');
    
    const apiRes = await fetch('https://golive-web.vercel.app/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            filename: 'large-test-upload.mp4',
            contentType: 'video/mp4',
            folder: 'videos/test'
        })
    });
    
    if (!apiRes.ok) {
        throw new Error(`API failed: ${apiRes.status}`);
    }
    
    const { url, path } = await apiRes.json();
    console.log('✅ Received Presigned URL.');
    
    console.log('2. Generating 100MB of dummy data...');
    // Create a 100MB buffer
    const dummyData = crypto.randomBytes(100 * 1024 * 1024);
    
    console.log('3. Uploading 100MB dummy data to R2 with strict browser headers...');
    const putRes = await fetch(url, {
        method: 'PUT',
        headers: {
            'Content-Type': 'video/mp4',
            'Cache-Control': 'public, max-age=31536000, immutable',
            'Origin': 'https://golive-web.vercel.app'
        },
        body: dummyData
    });
    
    if (putRes.ok) {
        console.log('✅ SUCCESS: Uploaded 100MB file directly to R2 bucket.');
    } else {
        console.error(`❌ Upload failed: ${putRes.status} ${await putRes.text()}`);
    }
}

testUpload().catch(console.error);
