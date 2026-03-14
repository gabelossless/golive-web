import { NextResponse } from 'next/server';

export async function POST(req: Request) {
    try {
        const { videoId } = await req.json();
        
        // Mocking AI analysis response
        // In Phase 3, this will call Gemini 2.5 Flash
        await new Promise(resolve => setTimeout(resolve, 3000)); // Simulate AI processing

        const moments = [
            {
                start: '00:12',
                end: '00:27',
                score: 98,
                reason: "High-energy transition with peak viewer engagement detected in audio and visual flow."
            },
            {
                start: '01:05',
                end: '01:20',
                score: 92,
                reason: "Surprising camera movement makes for an excellent vertical hook."
            },
            {
                start: '02:30',
                end: '02:45',
                score: 85,
                reason: "Funny outtake moment suitable for reaction loops."
            }
        ];

        return NextResponse.json({ 
            success: true, 
            moments 
        });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
