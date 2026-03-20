// lib/analytics-session.ts

import { v4 as uuidv4 } from 'uuid';

export function getAnalyticsSessionId(): string {
    if (typeof window === 'undefined') return '';
    
    let sessionId = sessionStorage.getItem('vibestream_session_id');
    
    if (!sessionId) {
        sessionId = uuidv4();
        sessionStorage.setItem('vibestream_session_id', sessionId);
    }
    
    return sessionId;
}

export function generateIpHash(ip: string): string {
    // Simple hash for client-side use (though server-side is better for actual IPs)
    let hash = 0;
    for (let i = 0; i < ip.length; i++) {
        const char = ip.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return hash.toString(36);
}
