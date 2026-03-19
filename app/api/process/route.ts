import { NextResponse } from 'next/server';
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { processVideo, cleanupTempFiles } from '@/lib/video-processor';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { Readable } from 'stream';
import pLimit from 'p-limit';
import { v4 as uuidv4 } from 'uuid';

const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID || '';
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID || '';
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY || '';
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME || '';

const S3 = new S3Client({
    region: 'auto',
    endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
        accessKeyId: R2_ACCESS_KEY_ID,
        secretAccessKey: R2_SECRET_ACCESS_KEY,
    },
});

// Concurrency limit for large batch uploads to R2
const limit = pLimit(15);

async function streamToFile(readableStream: Readable, filePath: string) {
    return new Promise((resolve, reject) => {
        const fileStream = fs.createWriteStream(filePath);
        readableStream.pipe(fileStream)
            .on('finish', () => resolve(true))
            .on('error', reject);
    });
}

export async function POST(request: Request) {
    let currentTempDir: string | null = null;
    
    try {
        const { rawPath, userId } = await request.json();

        if (!rawPath || !userId) {
            return NextResponse.json({ error: 'rawPath and userId required' }, { status: 400 });
        }

        const tempInputPath = path.join(os.tmpdir(), `input_${uuidv4()}.mov`);

        // 1. Download raw file from R2
        console.log('Fetching raw video for HLS processing:', rawPath);
        const getCommand = new GetObjectCommand({
            Bucket: R2_BUCKET_NAME,
            Key: rawPath,
        });

        const response = await S3.send(getCommand);
        if (!response.Body) {
            throw new Error('Failed to download raw video from R2');
        }

        await streamToFile(response.Body as Readable, tempInputPath);

        // 2. Process Video into HLS (ABR Ladder)
        const result = await processVideo(tempInputPath);
        currentTempDir = result.tempDir;

        // 3. Upload ALL HLS files (master + playlists + segments) to R2
        const uploadFolder = `videos/${userId}/${Date.now()}_hls`;
        
        console.log(`Uploading ${result.segmentPaths.length} HLS files to: ${uploadFolder}`);

        const uploadPromises = result.segmentPaths.map((filePath) => 
            limit(async () => {
                const fileName = path.basename(filePath);
                const fileContent = fs.readFileSync(filePath);
                const contentType = fileName.endsWith('.m3u8') 
                    ? 'application/vnd.apple.mpegurl' 
                    : 'video/mp2t';

                await S3.send(new PutObjectCommand({
                    Bucket: R2_BUCKET_NAME,
                    Key: `${uploadFolder}/${fileName}`,
                    Body: fileContent,
                    ContentType: contentType,
                    CacheControl: fileName.endsWith('.ts') ? 'public, max-age=31536000, immutable' : 'no-cache'
                }));
            })
        );

        await Promise.all(uploadPromises);

        const finalMasterPath = `${uploadFolder}/master.m3u8`;

        // 4. Cleanup
        try {
            if (fs.existsSync(tempInputPath)) fs.unlinkSync(tempInputPath);
            if (currentTempDir) cleanupTempFiles(currentTempDir);
        } catch (e) {
            console.warn('Cleanup warning:', e);
        }

        return NextResponse.json({
            success: true,
            path: finalMasterPath,
            hls: true
        });

    } catch (error: any) {
        console.error('HLS Processing API Error:', error);
        if (currentTempDir) cleanupTempFiles(currentTempDir);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
