import ffmpeg from 'fluent-ffmpeg';
import fs from 'fs';
import path from 'path';

// Manual robust path for Windows/Next.js/Turbopack
const getFFmpegPath = () => {
    const root = process.cwd();
    const possiblePaths = [
        path.join(root, 'node_modules', 'ffmpeg-static', 'ffmpeg.exe'),
        path.join(root, '..', 'node_modules', 'ffmpeg-static', 'ffmpeg.exe'), // In case of monorepo/nested run
        path.resolve('node_modules/ffmpeg-static/ffmpeg.exe'),
        'C:\\GOLive\\node_modules\\ffmpeg-static\\ffmpeg.exe' // absolute fallback for this machine
    ];

    for (const p of possiblePaths) {
        if (fs.existsSync(p)) {
            console.log('FFMPEG FOUND AT:', p);
            return p;
        }
    }
    return null;
};

const resolvedPath = getFFmpegPath();
if (resolvedPath) {
    ffmpeg.setFfmpegPath(resolvedPath);
} else {
    console.error('CRITICAL: FFmpeg binary not found in search paths!');
}

export interface ClipOptions {
    inputPath: string;
    outputPath: string;
    startTime: string; // e.g. "00:00:12"
    duration: number; // in seconds
    aspectRatio?: '9:16' | '16:9';
}

/**
 * Clips a video segment and processes it.
 * For Shorts, it will also apply a 9:16 crop or blur-padding logic.
 */
export async function createVideoClip(options: ClipOptions): Promise<string> {
    console.log('FFMPEG OPTIONS:', options);
    return new Promise((resolve, reject) => {
        const command = ffmpeg(options.inputPath)
            .setStartTime(options.startTime)
            .setDuration(options.duration);

        if (options.aspectRatio === '9:16') {
            // Complex filter for vertical video:
            // 1. Scale to 1080x1920
            // 2. Crop to 9:16 if wide, or add blur background if needed
            // For simplicity in Phase 3 start, we'll just scale/crop
            command.size('1080x1920').aspect('9:16');
        }

        command
            .on('start', (cmd) => console.log('FFMPEG started:', cmd))
            .on('progress', (progress) => console.log('Processing: ' + progress.percent + '% done'))
            .on('error', (err) => {
                console.error('FFMPEG Error:', err);
                reject(err);
            })
            .on('end', () => {
                console.log('FFMPEG Finished!');
                resolve(options.outputPath);
            })
            .save(options.outputPath);
    });
}

/**
 * Helper to download a video from a public URL to a temp location
 */
export async function downloadTempVideo(url: string, tempId: string): Promise<string> {
    console.log('Downloading video from:', url);
    const tempDir = path.join(process.cwd(), 'tmp');
    if (!fs.existsSync(tempDir)) {
        console.log('Creating tmp directory:', tempDir);
        fs.mkdirSync(tempDir, { recursive: true });
    }
    
    const targetPath = path.join(tempDir, `${tempId}.mp4`);
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Failed to download video: ${response.statusText}`);
    
    const buffer = Buffer.from(await response.arrayBuffer());
    fs.writeFileSync(targetPath, buffer);
    
    return targetPath;
}
