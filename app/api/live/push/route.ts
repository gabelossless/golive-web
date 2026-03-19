import { NextRequest, NextResponse } from 'next/server';
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';

const s3 = new S3Client({
    region: 'auto',
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID!,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
    },
});

const BUCKET_NAME = process.env.R2_BUCKET_NAME!;

export async function POST(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const userId = searchParams.get('userId');
        const streamId = searchParams.get('streamId');
        const index = searchParams.get('index');

        if (!userId || !streamId || !index) {
            return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
        }

        const buffer = await req.arrayBuffer();
        const segmentKey = `live/${userId}/${streamId}/seg_${index}.ts`;

        // 1. Upload segment to R2
        await s3.send(new PutObjectCommand({
            Bucket: BUCKET_NAME,
            Key: segmentKey,
            Body: Buffer.from(buffer),
            ContentType: 'video/mp2t',
        }));

        // 2. Update/Generate M3U8 Playlist
        // For a simple rolling window:
        const playlistKey = `live/${userId}/${streamId}/index.m3u8`;
        
        // We need to fetch the current playlist to append/roll
        let playlistContent = '';
        try {
            const getCommand = new GetObjectCommand({ Bucket: BUCKET_NAME, Key: playlistKey });
            const response = await s3.send(getCommand);
            playlistContent = await response.Body?.transformToString() || '';
        } catch (e) {
            // First segment, create index
            playlistContent = `#EXTM3U\n#EXT-X-VERSION:3\n#EXT-X-TARGETDURATION:5\n#EXT-X-MEDIA-SEQUENCE:0\n`;
        }

        // Add the new segment
        // In a real production system, you'd manage the sequence and rolling window more carefully.
        // Here we append the new segment.
        const segmentLine = `#EXTINF:2.0,\nseg_${index}.ts\n`;
        
        // If it's the very first segment, we don't want to double headers
        if (playlistContent.includes(`seg_${index}.ts`)) {
            // Already added? Skip or handle retry
        } else {
            playlistContent += segmentLine;
        }

        // Keep only top header + last 10 segments for "low cost" storage management
        const lines = playlistContent.split('\n');
        const header = lines.slice(0, 4); // #EXTM3U to MEDIA-SEQUENCE
        const body = lines.slice(4).filter(l => l.trim() !== '');
        
        // Each segment is 2 lines (#EXTINF and filename)
        let lastSegments = body;
        if (body.length > 20) { // 10 segments * 2 lines
            lastSegments = body.slice(-20);
            // Update Media Sequence
            const oldSeq = parseInt(header[3].split(':')[1]) || 0;
            header[3] = `#EXT-X-MEDIA-SEQUENCE:${oldSeq + 1}`;
        }

        const updatedPlaylist = [...header, ...lastSegments, ''].join('\n');

        await s3.send(new PutObjectCommand({
            Bucket: BUCKET_NAME,
            Key: playlistKey,
            Body: updatedPlaylist,
            ContentType: 'application/vnd.apple.mpegurl',
            CacheControl: 'no-cache, no-store, must-revalidate',
        }));

        return NextResponse.json({ 
            success: true, 
            url: `${process.env.R2_PUBLIC_URL}/${segmentKey}`,
            playlist: `${process.env.R2_PUBLIC_URL}/${playlistKey}`
        });

    } catch (error: any) {
        console.error('Live push error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
