import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import Ffmpeg from 'fluent-ffmpeg';
import ffmpegStatic from 'ffmpeg-static';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { Readable } from 'stream';

if (ffmpegStatic) Ffmpeg.setFfmpegPath(ffmpegStatic);

const S3 = new S3Client({
    region: 'auto',
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID!,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
    },
});

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(request: Request) {
    let tempInput = '';
    let tempOutput = '';
    try {
        const { videoId, startSec, endSec } = await request.json();
        if (!videoId || startSec === undefined || endSec === undefined) {
            return NextResponse.json({ error: 'videoId, startSec, endSec required' }, { status: 400 });
        }
        if (endSec - startSec > 60) {
            return NextResponse.json({ error: 'Clips must be 60 seconds or less' }, { status: 400 });
        }

        // Fetch source video
        const { data: video } = await supabaseAdmin
            .from('videos')
            .select('video_url, user_id, title, allow_clipping')
            .eq('id', videoId)
            .single();

        if (video?.allow_clipping === false) {
            return NextResponse.json({ error: 'Clipping is disabled for this video.' }, { status: 403 });
        }

        if (!video?.video_url) return NextResponse.json({ error: 'Video not found' }, { status: 404 });

        // Download video
        const videoRes = await fetch(video.video_url);
        if (!videoRes.ok) throw new Error('Could not download video for clipping');
        const videoBuffer = Buffer.from(await videoRes.arrayBuffer());

        tempInput = path.join(os.tmpdir(), `ai_clip_input_${Date.now()}.mp4`);
        tempOutput = path.join(os.tmpdir(), `ai_clip_output_${Date.now()}.mp4`);

        fs.writeFileSync(tempInput, videoBuffer);

        // Trim + convert to 9:16 reel format (1080x1920)
        // If source is horizontal, we create a blurred background fill (Instagram/YouTube Shorts style)
        await new Promise<void>((resolve, reject) => {
            Ffmpeg(tempInput)
                .setStartTime(startSec)
                .setDuration(endSec - startSec)
                .complexFilter([
                    // Scale source to 1080 wide, keeping aspect ratio
                    '[0:v]scale=1080:-2[fg]',
                    // Create blurred background at full reel resolution (1080x1920)
                    '[0:v]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,boxblur=20:20[bg]',
                    // Overlay the main video centered on the blurred background
                    '[bg][fg]overlay=(W-w)/2:(H-h)/2[v]'
                ], 'v')
                .outputOptions([
                    '-map [v]',
                    '-map 0:a?',
                    '-c:v libx264',
                    '-c:a aac',
                    '-preset fast',
                    '-crf 23',
                    '-movflags +faststart',
                    '-r 30',
                    '-s 1080x1920',
                ])
                .output(tempOutput)
                .on('end', () => resolve())
                .on('error', reject)
                .run();
        });

        // Upload to R2
        const shortFilename = `shorts/${video.user_id}/${Date.now()}_short.mp4`;
        const fileContent = fs.readFileSync(tempOutput);

        await S3.send(new PutObjectCommand({
            Bucket: process.env.R2_BUCKET_NAME!,
            Key: shortFilename,
            ContentType: 'video/mp4',
            Body: fileContent,
            // @ts-ignore — R2 supports Cache-Control
            CacheControl: 'public, max-age=31536000, immutable',
        }));

        const baseUrl = (process.env.NEXT_PUBLIC_R2_PUBLIC_URL || '').replace(/\/$/, '');
        const shortUrl = `${baseUrl}/${shortFilename}`;

        // Save to database as a Short
        const shortTitle = `✂️ ${(video.title || 'Clip').slice(0, 80)}`;
        const { data: newVideo, error: insertErr } = await supabaseAdmin
            .from('videos')
            .insert({
                user_id: video.user_id,
                title: shortTitle,
                video_url: shortUrl,
                is_short: true,
                duration: Math.round(endSec - startSec),
                view_count: 0,
            })
            .select('id')
            .single();

        if (insertErr || !newVideo) throw new Error('Failed to save Short: ' + (insertErr?.message || 'unknown'));

        return NextResponse.json({ shortId: newVideo.id, shortUrl });

    } catch (error: any) {
        console.error('AI Studio clip error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    } finally {
        try { if (tempInput) fs.unlinkSync(tempInput); } catch (_) { }
        try { if (tempOutput) fs.unlinkSync(tempOutput); } catch (_) { }
    }
}
