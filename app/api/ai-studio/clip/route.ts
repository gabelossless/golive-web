import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { createVideoClip, downloadTempVideo } from '@/lib/video-clipping';
import path from 'path';
import fs from 'fs';
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

const s3Client = new S3Client({
    region: "auto",
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
    },
});

export async function POST(req: Request) {
    let tempInputPath = '';
    let tempOutputPath = '';

    try {
        const body = await req.json();
        console.log('CLIP REQUEST BODY:', body);
        const { videoId, startTime, duration, title } = body;

        console.log('1. Fetching original video details for ID:', videoId);
        const { data: video, error: fetchError } = await supabase
            .from('videos')
            .select('video_url, user_id')
            .eq('id', videoId)
            .single();

        if (fetchError || !video) {
            console.error('Fetch error:', fetchError);
            throw new Error('Video not found or access denied');
        }
        console.log('Found video:', video.video_url);

        console.log('2. Downloading to local temp...');
        const tempId = `clip_${Date.now()}`;
        tempInputPath = await downloadTempVideo(video.video_url, `${tempId}_in`);
        tempOutputPath = path.join(process.cwd(), 'tmp', `${tempId}_out.mp4`);
        console.log('Temp paths:', { tempInputPath, tempOutputPath });

        console.log('3. Starting FFmpeg Process...');
        await createVideoClip({
            inputPath: tempInputPath,
            outputPath: tempOutputPath,
            startTime,
            duration,
            aspectRatio: '9:16'
        });
        console.log('FFmpeg Process Done.');

        console.log('4. Uploading to R2...');
        const fileBuffer = fs.readFileSync(tempOutputPath);
        const key = `shorts/${video.user_id}/${tempId}.mp4`;
        
        console.log('Uploading key:', key);
        await s3Client.send(new PutObjectCommand({
            Bucket: process.env.R2_BUCKET_NAME,
            Key: key,
            Body: fileBuffer,
            ContentType: 'video/mp4'
        }));
        console.log('R2 Upload Finished.');

        const publicUrl = `${process.env.NEXT_PUBLIC_R2_PUBLIC_URL}/${key}`;

        // 5. Check Premium Status for resilient storage
        const { data: profile } = await supabase
            .from('profiles')
            .select('subscription_tier')
            .eq('id', video.user_id)
            .single();

        let finalVideoUrl = publicUrl;
        let storageType = 'r2';

        if (profile?.subscription_tier === 'premium') {
            console.log('5. Premium User Detected - Dual Upload/Fallback...');
            try {
                const { data: uploadData, error: uploadError } = await supabase.storage
                    .from('premium-videos')
                    .upload(`${video.user_id}/${tempId}.mp4`, fileBuffer, {
                        contentType: 'video/mp4',
                        cacheControl: '3600',
                        upsert: false
                    });
                
                if (!uploadError && uploadData) {
                    const { data: { publicUrl: supabaseUrl } } = supabase.storage
                        .from('premium-videos')
                        .getPublicUrl(uploadData.path);
                    
                    console.log('Supabase Premium Storage Uploaded:', supabaseUrl);
                    finalVideoUrl = supabaseUrl; // Use Supabase for premium as requested for resilience
                    storageType = 'supabase-premium';
                } else {
                    console.error('Supabase Premium Upload Error:', uploadError);
                }
            } catch (storageErr) {
                console.error('Failed premium storage fallback:', storageErr);
            }
        }

        // 6. Create Database Entry
        const { data: newShort, error: dbError } = await supabase.from('videos').insert({
            user_id: video.user_id,
            title: `[Short] ${title}`,
            video_url: finalVideoUrl,
            thumbnail_url: null,
            is_short: true,
            duration: duration,
            category: 'Shorts',
            visibility: 'public'
        }).select().single();

        if (dbError) {
            console.error('DB Insert Error:', dbError);
            throw dbError;
        }

        return NextResponse.json({ 
            success: true, 
            shortId: newShort.id,
            url: finalVideoUrl,
            storage: storageType
        });

    } catch (err: any) {
        console.error('Clipping Error:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    } finally {
        // Cleanup temp files
        if (tempInputPath && fs.existsSync(tempInputPath)) fs.unlinkSync(tempInputPath);
        if (tempOutputPath && fs.existsSync(tempOutputPath)) fs.unlinkSync(tempOutputPath);
    }
}
