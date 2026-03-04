import { NextResponse } from 'next/server';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID || '';
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID || '';
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY || '';
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME || '';

// Initialize S3 client for Cloudflare R2
const S3 = new S3Client({
    region: 'auto',
    endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
        accessKeyId: R2_ACCESS_KEY_ID,
        secretAccessKey: R2_SECRET_ACCESS_KEY,
    },
});

export async function POST(request: Request) {
    try {
        const { filename, contentType, folder } = await request.json();

        if (!filename || !contentType) {
            return NextResponse.json(
                { error: 'Filename and processType required' },
                { status: 400 }
            );
        }

        // Sanitize filename and create unique path
        const sanitizedName = filename.replace(/[^a-zA-Z0-9.-]/g, '_');
        const path = folder ? `${folder}/${Date.now()}_${sanitizedName}` : `${Date.now()}_${sanitizedName}`;

        const command = new PutObjectCommand({
            Bucket: R2_BUCKET_NAME,
            Key: path,
            ContentType: contentType,
        });

        // Generate a presigned URL valid for 15 minutes
        const url = await getSignedUrl(S3, command, { expiresIn: 900 });

        return NextResponse.json({
            url, // The presigned upload URL
            path, // The relative path in the bucket
        });

    } catch (error: any) {
        console.error('Presigned URL Error:', error);
        return NextResponse.json(
            { error: 'Could not generate upload URL' },
            { status: 500 }
        );
    }
}
