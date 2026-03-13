const crypto = require('crypto');

async function testMultipart() {
    const CHUNK_SIZE = 5 * 1024 * 1024; // 5MB
    const fileSize = 15 * 1024 * 1024; // 15MB dummy file
    console.log(`0. Generating ${fileSize / (1024*1024)}MB of dummy data...`);
    const dummyData = crypto.randomBytes(fileSize);

    console.log('1. Call /api/upload/multipart [create]');
    const createRes = await fetch('http://localhost:3000/api/upload/multipart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            action: 'create',
            filename: 'multipart-test.mp4',
            contentType: 'video/mp4',
            folder: 'videos/test'
        })
    });

    if (!createRes.ok) throw new Error(`Create failed: ${await createRes.text()}`);
    const { uploadId, key } = await createRes.json();
    console.log(`✅ Created Upload ID: ${uploadId}, Key: ${key}`);

    const totalChunks = Math.ceil(fileSize / CHUNK_SIZE);
    const parts = [];

    for (let i = 0; i < totalChunks; i++) {
        const start = i * CHUNK_SIZE;
        const end = Math.min(start + CHUNK_SIZE, fileSize);
        const chunk = dummyData.slice(start, end);
        const partNumber = i + 1;

        console.log(`2.${partNumber}. Call /api/upload/multipart [sign] for chunk ${partNumber}/${totalChunks}`);
        const signRes = await fetch('http://localhost:3000/api/upload/multipart', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'sign', uploadId, key, partNumber })
        });

        if (!signRes.ok) throw new Error(`Sign failed for part ${partNumber}`);
        const { url } = await signRes.json();

        console.log(`   -> Uploading ${chunk.length} bytes to pre-signed URL...`);
        const putRes = await fetch(url, {
            method: 'PUT',
            body: chunk
        });

        if (!putRes.ok) throw new Error(`PUT failed for part ${partNumber}: ${putRes.status}`);
        const etag = putRes.headers.get('ETag');
        console.log(`   ✅ Success! ETag: ${etag}`);
        parts.push({ ETag: etag.replace(/"/g, ''), PartNumber: partNumber });
    }

    console.log('3. Call /api/upload/multipart [complete]');
    const completeRes = await fetch('http://localhost:3000/api/upload/multipart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'complete', uploadId, key, parts })
    });

    if (!completeRes.ok) throw new Error(`Complete failed: ${await completeRes.text()}`);
    const { path } = await completeRes.json();

    console.log(`✅ Multipart Upload Completed Successfully!`);
    console.log(`File is located at: https://pub-3460ade86c9d4018be04f796bad3ff79.r2.dev/${path}`);
}

testMultipart().catch(console.error);
