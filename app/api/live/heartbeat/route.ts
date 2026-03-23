import { createClient } from "@/lib/supabase-server";
import { NextResponse } from "next/server";

const VIEWER_THRESHOLD = 50;

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { videoId, viewerCount } = await req.json();

    if (!videoId) {
      return NextResponse.json({ error: "Missing videoId" }, { status: 400 });
    }

    // 1. Fetch current stream record to check threshold
    const { data: video, error: fetchError } = await supabase
        .from('videos')
        .select('pipeline, title, is_live')
        .eq('id', videoId)
        .eq('user_id', user.id)
        .single();

    if (fetchError || !video?.is_live) {
        return NextResponse.json({ error: "Stream not found or offline" }, { status: 404 });
    }

    let nextPipeline = video.pipeline;
    let switchPayload = null;

    // 2. Logic to Switch Pipeline from SFU to HLS
    // If viewers > 50 and we are currently on SFU, we need to upgrade them to Livepeer!
    if (viewerCount > VIEWER_THRESHOLD && video.pipeline === 'LIVEKIT_SFU') {
        const lpRes = await fetch("https://livepeer.studio/api/stream", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${process.env.LIVEPEER_API_KEY}`,
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              name: `ScaleUp: ${video.title || videoId}`,
              profiles: [] // Zero-cost transcoding profile
            })
        });

        if (lpRes.ok) {
            const livepeerData = await lpRes.json();
            nextPipeline = 'LIVEPEER_HLS';
            switchPayload = {
                pipeline: 'LIVEPEER_HLS',
                stream_key: livepeerData.streamKey,
                playbackId: livepeerData.playbackId,
                livepeer_stream_id: livepeerData.id
            };
        } else {
            console.error("[Scaling] Failed to provision Livepeer upgrade", await lpRes.text());
        }
    }

    // 3. Update heartbeat, viewer count, and possibly the new pipeline
    const updateData: any = {
        viewer_count: viewerCount || 0,
        last_heartbeat: new Date().toISOString()
    };

    if (switchPayload) {
        updateData.pipeline = switchPayload.pipeline;
        updateData.livepeer_stream_id = switchPayload.livepeer_stream_id;
        updateData.playback_id = switchPayload.playbackId; // This dictates the video_url technically. Need logic to construct it.
        // Usually video_url is `https://livepeercdn.studio/hls/${playbackId}/index.m3u8`
        updateData.video_url = `https://livepeercdn.studio/hls/${switchPayload.playbackId}/index.m3u8`;
    }

    const { error } = await supabase
      .from("videos")
      .update(updateData)
      .eq("id", videoId)
      .eq("user_id", user.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // 4. If we switched, instruct the creator's client to jump to WHIP!
    if (switchPayload) {
        return NextResponse.json({ 
            success: true, 
            switch_pipeline: true, 
            stream_key: switchPayload.stream_key 
        });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
