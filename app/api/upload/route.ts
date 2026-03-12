import { NextResponse } from 'next/server';
import { S3Client, PutObjectCommand, HeadBucketCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

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

// CORS headers for all responses from this endpoint
const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// Handle preflight OPTIONS (required for CORS)
export async function OPTIONS() {
    return new NextResponse(null, { status: 204, headers: corsHeaders });
}

export async function POST(request: Request) {
    // Quick config validation
    if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY || !R2_BUCKET_NAME) {
        console.error('R2 config missing:', {
            accountId: !!R2_ACCOUNT_ID,
            keyId: !!R2_ACCESS_KEY_ID,
            secret: !!R2_SECRET_ACCESS_KEY,
            bucket: !!R2_BUCKET_NAME,
        });
        return NextResponse.json(
            { error: 'Storage not configured. Contact support.' },
            { status: 500, headers: corsHeaders }
        );
    }

    try {
        const { filename, contentType, folder } = await request.json();

        if (!filename || !contentType) {
            return NextResponse.json(
                { error: 'Filename and contentType required' },
                { status: 400, headers: corsHeaders }
            );
        }

        // Sanitize filename and create unique path
        const sanitizedName = filename.replace(/[^a-zA-Z0-9.\-]/g, '_');
        const path = folder
            ? `${folder}/${Date.now()}_${sanitizedName}`
            : `${Date.now()}_${sanitizedName}`;

        const command = new PutObjectCommand({
            Bucket: R2_BUCKET_NAME,
            Key: path,
            ContentType: contentType,
            // Cache-Control baked into the presigned URL so the browser PUT sets it too
            CacheControl: 'public, max-age=31536000, immutable',
        });

        // Generate a presigned URL valid for 30 minutes (larger files on slow connections)
        const url = await getSignedUrl(S3, command, { expiresIn: 1800 });

        return NextResponse.json({ url, path }, { headers: corsHeaders });

    } catch (error: any) {
        console.error('R2 Presigned URL Error:', {
            message: error.message,
            code: error.code,
            bucket: R2_BUCKET_NAME,
            accountId: R2_ACCOUNT_ID ? 'set' : 'MISSING',
            keyId: R2_ACCESS_KEY_ID ? 'set' : 'MISSING',
            secret: R2_SECRET_ACCESS_KEY ? 'set' : 'MISSING',
        });
        return NextResponse.json(
            { error: `Upload error: ${error.message || 'Unknown R2 error'}` },
            { status: 500, headers: corsHeaders }
        );
    }
}
