'use client';

import { useEffect } from 'react';
import { AlertCircle, RefreshCcw } from 'lucide-react';

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error(error);
    }, [error]);

    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6">
            <div className="w-20 h-20 bg-destructive/10 rounded-full flex items-center justify-center">
                <AlertCircle size={40} className="text-destructive" />
            </div>
            <div className="space-y-2">
                <h2 className="text-2xl font-black">Something went wrong!</h2>
                <p className="text-muted max-w-md mx-auto">{error.message || 'An unexpected error occurred.'}</p>
            </div>
            <button
                onClick={() => reset()}
                className="btn btn-secondary border border-border px-6 py-2 rounded-full font-bold flex items-center gap-2 hover:bg-surface-hover transition-colors"
            >
                <RefreshCcw size={16} />
                Try again
            </button>
        </div>
    );
}
