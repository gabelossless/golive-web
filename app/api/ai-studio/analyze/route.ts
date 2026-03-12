import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { GoogleGenAI } from '@google/genai';

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const genai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

export async function POST(request: Request) {
    try {
        const { videoId } = await request.json();
        if (!videoId) return NextResponse.json({ error: 'videoId required' }, { status: 400 });
        if (!process.env.GEMINI_API_KEY) return NextResponse.json({ error: 'GEMINI_API_KEY not configured in Vercel environment variables.' }, { status: 500 });

        // Fetch video metadata from Supabase
        const { data: video, error: dbError } = await supabaseAdmin
            .from('videos')
            .select('video_url, duration, title')
            .eq('id', videoId)
            .single();

        if (dbError || !video) return NextResponse.json({ error: 'Video not found' }, { status: 404 });

        const videoUrl = video.video_url;
        if (!videoUrl) return NextResponse.json({ error: 'Video URL not available' }, { status: 400 });

        // Pass the public R2 URL directly — Gemini fetches the video itself.
        // This avoids SDK upload signature issues and Vercel payload limits.
        const filePart: any = { fileData: { mimeType: 'video/mp4', fileUri: videoUrl } };

        const prompt = `You are a viral content strategist. Analyze this video and identify 2-4 timestamps that are most likely to perform well as short-form clips on platforms like YouTube Shorts, TikTok, and Instagram Reels.

For each moment, provide:
- startSec: start time in seconds (integer)
- endSec: end time in seconds (integer, max 60 seconds per clip)
- reason: a brief, specific explanation of why this moment is viral-worthy (max 120 chars)
- viralScore: 0.0 to 1.0 float representing viral potential

Focus on: emotional peaks, surprising moments, strong hooks in the first 3 seconds, satisfying conclusions, humor, impressive skills, or noteworthy statements.

Respond ONLY with a valid JSON array. No markdown, no explanation, just the array:
[{"startSec": 0, "endSec": 30, "reason": "...", "viralScore": 0.85}]`;

        const response = await genai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: [{ role: 'user', parts: [filePart, { text: prompt }] }],
            config: { responseMimeType: 'application/json' }
        });

        const text = response.text || '';

        let moments;
        try {
            // Parse the response, stripping any markdown if present
            const cleaned = text.replace(/```json|```/g, '').trim();
            moments = JSON.parse(cleaned);
            if (!Array.isArray(moments)) throw new Error('Not an array');
        } catch {
            // If JSON parsing fails, return a helpful error
            return NextResponse.json({
                error: 'AI could not analyze this video. Please try a video with more dynamic content.'
            }, { status: 422 });
        }

        // Validate and sanitize each moment
        const validated = moments
            .filter((m: any) => typeof m.startSec === 'number' && typeof m.endSec === 'number')
            .map((m: any) => ({
                startSec: Math.max(0, Math.round(m.startSec)),
                endSec: Math.min(Math.round(m.endSec), m.endSec),
                reason: String(m.reason || '').slice(0, 120),
                viralScore: Math.min(1, Math.max(0, Number(m.viralScore) || 0.5)),
            }))
            .sort((a: any, b: any) => b.viralScore - a.viralScore)
            .slice(0, 4);

        return NextResponse.json({ moments: validated });

    } catch (error: any) {
        console.error('AI Studio analyze error:', error);
        return NextResponse.json({ error: error.message || 'Analysis failed' }, { status: 500 });
    }
}
