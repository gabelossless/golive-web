import { NextResponse } from 'next/server';
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { processVideo } from '@/lib/video-processor';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { Readable } from 'stream';

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

async function streamToFile(readableStream: Readable, filePath: string) {
    return new Promise((resolve, reject) => {
        const fileStream = fs.createWriteStream(filePath);
        readableStream.pipe(fileStream)
            .on('finish', () => resolve(true))
            .on('error', reject);
    });
}

export async function POST(request: Request) {
    try {
        const { rawPath, userId } = await request.json();

        if (!rawPath || !userId) {
            return NextResponse.json({ error: 'rawPath and userId required' }, { status: 400 });
        }

        const tempInputPath = path.join(os.tmpdir(), `input_${Date.now()}.mov`);

        // 1. Download raw file from R2
        const getCommand = new GetObjectCommand({
            Bucket: R2_BUCKET_NAME,
            Key: rawPath,
        });

        const response = await S3.send(getCommand);
        if (!response.Body) {
            throw new Error('Failed to download raw video from R2');
        }

        await streamToFile(response.Body as Readable, tempInputPath);

        // 2. Process Video
        const result = await processVideo(tempInputPath);

        // 3. Upload processed video back to R2
        const processedFilename = `videos/${userId}/${Date.now()}_optimized.mp4`;
        const fileContent = fs.readFileSync(result.outputPath);

        const putCommand = new PutObjectCommand({
            Bucket: R2_BUCKET_NAME,
            Key: processedFilename,
            ContentType: 'video/mp4',
        });

        await S3.send(putCommand);

        // Wait, PutObjectCommand with Body
        const putCommandWithBody = new PutObjectCommand({
            Bucket: R2_BUCKET_NAME,
            Key: processedFilename,
            ContentType: 'video/mp4',
            Body: fileContent,
        });
        await S3.send(putCommandWithBody);

        // 4. Cleanup
        try {
            fs.unlinkSync(tempInputPath);
            fs.unlinkSync(result.outputPath);
        } catch (e) {
            console.warn('Failed to cleanup temp files:', e);
        }

        return NextResponse.json({
            success: true,
            path: processedFilename,
            duration: result.duration,
            width: result.width,
            height: result.height
        });

    } catch (error: any) {
        console.error('Video Processing Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
