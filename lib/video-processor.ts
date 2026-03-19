import ffmpeg from 'fluent-ffmpeg';
import ffmpegStatic from 'ffmpeg-static';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { v4 as uuidv4 } from 'uuid';

if (ffmpegStatic) {
    ffmpeg.setFfmpegPath(ffmpegStatic);
}

export interface HLSProcessingResult {
    m3u8Path: string;
    segmentPaths: string[];
    masterPlaylistPath: string;
    tempDir: string;
}

interface VideoResolution {
    width: number;
    height: number;
    bitrate: string;
    maxrate: string;
    bufsize: string;
}

// Standard adaptive bitrate ladder for HLS (2025-2026 optimized)
const ABR_LADDER: VideoResolution[] = [
    { width: 426, height: 240, bitrate: '400k', maxrate: '428k', bufsize: '600k' },    // 240p
    { width: 640, height: 360, bitrate: '800k', maxrate: '856k', bufsize: '1200k' },   // 360p
    { width: 854, height: 480, bitrate: '1500k', maxrate: '1605k', bufsize: '2250k' },  // 480p
    { width: 1280, height: 720, bitrate: '3000k', maxrate: '3210k', bufsize: '4500k' }, // 720p
    { width: 1920, height: 1080, bitrate: '6000k', maxrate: '6420k', bufsize: '9000k' } // 1080p
];

export async function processVideo(inputPath: string): Promise<HLSProcessingResult> {
    const tempDir = path.join(os.tmpdir(), `vibe-hls-${uuidv4()}`);
    if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
    }

    const masterPlaylistPath = path.join(tempDir, 'master.m3u8');

    // Create filter complex for multi-resolution scaling
    const filterComplex = ABR_LADDER.map((res, index) => {
        return `[0:v]scale=w=${res.width}:h=${res.height}:force_original_aspect_ratio=decrease,pad=${res.width}:${res.height}:(ow-iw)/2:(oh-ih)/2[v${index}]`;
    }).join(';');

    return new Promise((resolve, reject) => {
        let command = ffmpeg(inputPath)
            .complexFilter(filterComplex)
            // Audio settings (shared across all renditions)
            .audioCodec('aac')
            .audioBitrate('128k')
            .audioFrequency(48000)
            .outputOptions([
                '-f hls',
                '-hls_time 4',                     // 4-second segments for standard HLS
                '-hls_playlist_type vod',
                '-hls_flags independent_segments',
                '-hls_segment_type mpegts',         // Standard TS segments for compatibility
                '-master_pl_name master.m3u8',
                '-hls_segment_filename', path.join(tempDir, 'video_%v_%03d.ts'),
                '-var_stream_map', ABR_LADDER.map((_, i) => `v:${i},a:0`).join(' ')
            ]);

        // Add bitrate controls per variant
        ABR_LADDER.forEach((res, i) => {
            command = command.outputOptions([
                `-map [v${i}]`,
                `-c:v:${i} libx264`,
                `-b:v:${i} ${res.bitrate}`,
                `-maxrate:v:${i} ${res.maxrate}`,
                `-bufsize:v:${i} ${res.bufsize}`,
                `-crf 23`,
                `-preset medium`,
                `-profile:v:${i} main`,
                `-g 48`,                          // Keyframe interval every 2 seconds (assuming 24fps)
                `-keyint_min 48`,
                `-sc_threshold 0`
            ]);
        });

        command
            .on('start', (cmd) => console.log('FFmpeg HLS Pipeline:', cmd))
            .on('error', (err) => {
                console.error('HLS Processing Error:', err);
                reject(err);
            })
            .on('end', () => {
                const allFiles = fs.readdirSync(tempDir);
                const segmentPaths = allFiles
                    .filter(f => f.endsWith('.ts') || f.endsWith('.m3u8')) // Collect all playlists too
                    .map(f => path.join(tempDir, f));
                
                resolve({
                    m3u8Path: masterPlaylistPath,
                    segmentPaths,
                    masterPlaylistPath,
                    tempDir
                });
            })
            .save(path.join(tempDir, 'video_%v.m3u8'));
    });
}

export function cleanupTempFiles(tempDir: string) {
    try {
        if (fs.existsSync(tempDir)) {
            // Recursive delete using native fs.rmSync if available (Node 14+)
            if (fs.rmSync) {
                fs.rmSync(tempDir, { recursive: true, force: true });
            } else {
                const files = fs.readdirSync(tempDir);
                for (const file of files) {
                    const curPath = path.join(tempDir, file);
                    if (fs.lstatSync(curPath).isDirectory()) {
                        cleanupTempFiles(curPath);
                    } else {
                        fs.unlinkSync(curPath);
                    }
                }
                fs.rmdirSync(tempDir);
            }
        }
    } catch (e) {
        console.warn('Cleanup warning:', e);
    }
}
