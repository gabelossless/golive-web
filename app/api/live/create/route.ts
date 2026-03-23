import { createClient } from "@/lib/supabase-server";
import { chooseStreamRoute } from "@/lib/stream-allocator";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 1. Check if user is premium
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("is_premium, role")
      .eq("id", user.id)
      .single();

    if (profileError || (!profile.is_premium && profile.role !== 'admin')) {
      return NextResponse.json({ error: "Premium subscription required to go live" }, { status: 403 });
    }

    const { title, category, is_gated, price } = await req.json();

    // 2. Initial Allocation (Start with SFU for low-cost/low-latency)
    const pipeline = chooseStreamRoute({ viewerCount: 0, isPremium: true });

    let livepeerData = null;

    // Even if starting on SFU, we might want to prep Livepeer if they expect a big crowd
    // or just wait until the threshold is hit. For now, let's keep it lean.
    
    if (pipeline === "LIVEPEER_HLS") {
      const lpRes = await fetch("https://livepeer.studio/api/stream", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.LIVEPEER_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          name: title || `${user.id}'s Stream`,
          profiles: [] // Disable transcoding for $0 cost optimization
        })
      });

      if (lpRes.ok) {
        livepeerData = await lpRes.json();
      }
    }

    // 3. Create entry in videos table (serves as the stream record)
    const { data: video, error: videoError } = await supabase
      .from("videos")
      .insert({
        user_id: user.id,
        title: title || "New Live Stream",
        category: category || "General",
        is_live: true,
        pipeline: pipeline,
        livepeer_stream_id: livepeerData?.id,
        playback_id: livepeerData?.playbackId,
        is_gated: is_gated || false,
        price: price || 0,
        started_at: new Date().toISOString(),
        last_heartbeat: new Date().toISOString()
      })
      .select()
      .single();

    if (videoError) {
      return NextResponse.json({ error: videoError.message }, { status: 500 });
    }

    return NextResponse.json({
      ...video,
      stream_key: livepeerData?.streamKey // Only return stream key to creator
    });

  } catch (error: any) {
    console.error("Stream creation error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
