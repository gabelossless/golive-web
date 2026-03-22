/**
 * Client-side image processing for VibeStream
 * Handles resizing, compression, and format normalization
 */

export interface ImageOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
}

import heic2any from 'heic2any';

/**
 * Compresses an image and returns a Blob/File
 * Supports JPEG/PNG resizing and quality adjustment
 * Now handles HEIC conversion for smartphone uploads
 */
export async function compressImage(file: File, options: ImageOptions = {}): Promise<Blob> {
  const { maxWidth = 1080, maxHeight = 1080, quality = 0.8 } = options;

  // Handle HEIC conversion if needed
  let processingFile: File | Blob = file;
  if (file.name.toLowerCase().endsWith('.heic') || file.type === 'image/heic') {
    try {
      const converted = await heic2any({
        blob: file,
        toType: 'image/jpeg',
        quality,
      });
      processingFile = Array.isArray(converted) ? converted[0] : converted;
    } catch (err) {
      console.error('HEIC conversion failed, attempting raw process:', err);
    }
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(processingFile);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Calculate aspect-ratio preserved dimensions
        if (width > height) {
          if (width > maxWidth) {
            height *= maxWidth / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width *= maxHeight / height;
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas context failed'));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        
        // Output as optimized JPEG for better compression
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Compression failed'));
            }
          },
          'image/jpeg',
          quality
        );
      };
      img.onerror = () => reject(new Error('Image load error'));
    };
    reader.onerror = () => reject(new Error('File read error'));
  });
}

/**
 * Direct upload to R2 using the presigned URL flow
 */
export async function uploadToR2(file: File | Blob, originalFilename: string, folder: string) {
  const contentType = file.type || 'image/jpeg';
  const filename = originalFilename.endsWith('.heic') ? originalFilename.replace(/\.heic$/i, '.jpg') : originalFilename;

  // 1. Get presigned URL
  const res = await fetch('/api/upload', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ filename, contentType, folder }),
  });

  if (!res.ok) throw new Error('Failed to get upload URL');
  const { url, path } = await res.json();

  // 2. PUT directly to R2
  const uploadRes = await fetch(url, {
    method: 'PUT',
    headers: { 'Content-Type': contentType },
    body: file,
  });

  if (!uploadRes.ok) throw new Error('Upload failed');

  // Return the public URL (derived from bucket path)
  const publicBaseUrl = process.env.NEXT_PUBLIC_R2_PUBLIC_URL || '';
  return publicBaseUrl.endsWith('/') ? `${publicBaseUrl}${path}` : `${publicBaseUrl}/${path}`;
}

/**
 * Premium "Ghost" Avatar. Returns a base64 DataURI of a sleek VibeStream SVG.
 */
export function getGhostAvatar() {
  return `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="%231a1a1a"/><path d="M50 30c-11.05 0-20 8.95-20 20s8.95 20 20 20 20-8.95 20-20-8.95-20-20-20zm0 30c-5.52 0-10-4.48-10-10s4.48-10 10-10 10 4.48 10 10-4.48 10-10 10z" fill="%23ffd700" fill-opacity="0.8"/><circle cx="50" cy="50" r="45" fill="none" stroke="%23ffd700" stroke-width="2" stroke-dasharray="2 4" opacity="0.4"/></svg>`;
}
