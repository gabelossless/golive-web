import { NextResponse } from 'next/server';
import { 
    S3Client, 
    CreateMultipartUploadCommand, 
    UploadPartCommand, 
    CompleteMultipartUploadCommand,
    AbortMultipartUploadCommand
} from '@aws-sdk/client-s3';
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

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
    return new NextResponse(null, { status: 204, headers: corsHeaders });
}

export async function POST(request: Request) {
    if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY || !R2_BUCKET_NAME) {
        return NextResponse.json({ error: 'Storage not configured.' }, { status: 500, headers: corsHeaders });
    }

    try {
        const body = await request.json();
        const { action } = body;

        // ACTION: CREATE
        if (action === 'create') {
            const { filename, contentType, folder } = body;
            if (!filename || !contentType) {
                return NextResponse.json({ error: 'Filename/contentType required' }, { status: 400, headers: corsHeaders });
            }

            const sanitizedName = filename.replace(/[^a-zA-Z0-9.\-]/g, '_');
            const key = folder ? `${folder}/${Date.now()}_${sanitizedName}` : `${Date.now()}_${sanitizedName}`;

            const command = new CreateMultipartUploadCommand({
                Bucket: R2_BUCKET_NAME,
                Key: key,
                ContentType: contentType,
                CacheControl: 'public, max-age=31536000, immutable',
            });

            const response = await S3.send(command);
            
            return NextResponse.json({ 
                uploadId: response.UploadId, 
                key: response.Key 
            }, { headers: corsHeaders });
        }

        // ACTION: SIGN
        if (action === 'sign') {
            const { uploadId, key, partNumber } = body;
            if (!uploadId || !key || !partNumber) {
                return NextResponse.json({ error: 'uploadId, key, partNumber required' }, { status: 400, headers: corsHeaders });
            }

            const command = new UploadPartCommand({
                Bucket: R2_BUCKET_NAME,
                Key: key,
                UploadId: uploadId,
                PartNumber: partNumber,
            });

            // 15 minutes is plenty for a single 5MB chunk
            const url = await getSignedUrl(S3, command, { expiresIn: 900 });

            return NextResponse.json({ url }, { headers: corsHeaders });
        }

        // ACTION: COMPLETE
        if (action === 'complete') {
            const { uploadId, key, parts } = body;
            if (!uploadId || !key || !parts || !Array.isArray(parts)) {
                return NextResponse.json({ error: 'uploadId, key, parts required' }, { status: 400, headers: corsHeaders });
            }

            // Sort parts by PartNumber (required by S3)
            const sortedParts = parts.sort((a, b) => a.PartNumber - b.PartNumber);

            const command = new CompleteMultipartUploadCommand({
                Bucket: R2_BUCKET_NAME,
                Key: key,
                UploadId: uploadId,
                MultipartUpload: {
                    Parts: sortedParts
                }
            });

            await S3.send(command);

            return NextResponse.json({ path: key }, { headers: corsHeaders });
        }
        
        // ACTION: ABORT (Optional, good for cleanup)
        if (action === 'abort') {
            const { uploadId, key } = body;
            if (!uploadId || !key) {
                return NextResponse.json({ error: 'uploadId, key required' }, { status: 400, headers: corsHeaders });
            }

            const command = new AbortMultipartUploadCommand({
                Bucket: R2_BUCKET_NAME,
                Key: key,
                UploadId: uploadId,
            });

            await S3.send(command);
            return NextResponse.json({ success: true }, { headers: corsHeaders });
        }

        return NextResponse.json({ error: 'Invalid action' }, { status: 400, headers: corsHeaders });

    } catch (error: any) {
        console.error('Multipart API Error:', error);
        return NextResponse.json({ error: error.message || 'Server error' }, { status: 500, headers: corsHeaders });
    }
}
