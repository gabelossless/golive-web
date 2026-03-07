import ffmpeg from 'fluent-ffmpeg';
import ffmpegStatic from 'ffmpeg-static';
import fs from 'fs';
import path from 'path';
import os from 'os';

if (ffmpegStatic) {
    ffmpeg.setFfmpegPath(ffmpegStatic);
}

export interface ProcessingResult {
    outputPath: string;
    duration: string;
    width: number;
    height: number;
}

export async function processVideo(inputPath: string): Promise<ProcessingResult> {
    const tempDir = os.tmpdir();
    const outputFilename = `processed_${Date.now()}.mp4`;
    const outputPath = path.join(tempDir, outputFilename);

    return new Promise((resolve, reject) => {
        ffmpeg(inputPath)
            .outputOptions([
                '-c:v libx264',    // Use H.264 codec for universal compatibility
                '-crf 23',         // Balanced quality/size constant rate factor
                '-preset fast',    // Speed up transcoding
                '-pix_fmt yuv420p', // Ensure compatibility with all players (including old ones and QuickTime)
                '-c:a aac',        // Use AAC audio
                '-b:a 128k',       // Standard audio bitrate
                '-movflags +faststart' // Enable fast playback (metadata at the beginning)
            ])
            .on('start', (commandLine) => {
                console.log('Spawned Ffmpeg with command: ' + commandLine);
            })
            .on('error', (err) => {
                console.error('An error occurred: ' + err.message);
                reject(err);
            })
            .on('end', () => {
                console.log('Processing finished !');

                // Get metadata of the output file
                ffmpeg.ffprobe(outputPath, (err, metadata) => {
                    if (err) {
                        resolve({ outputPath, duration: '0:00', width: 0, height: 0 });
                        return;
                    }

                    const stream = metadata.streams.find(s => s.codec_type === 'video');
                    const durationInSeconds = metadata.format.duration || 0;
                    const minutes = Math.floor(durationInSeconds / 60);
                    const seconds = Math.floor(durationInSeconds % 60);

                    resolve({
                        outputPath,
                        duration: `${minutes}:${seconds.toString().padStart(2, '0')}`,
                        width: stream?.width || 0,
                        height: stream?.height || 0
                    });
                });
            })
            .save(outputPath);
    });
}
