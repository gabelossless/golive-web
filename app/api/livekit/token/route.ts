import { AccessToken } from "livekit-server-sdk";
import { createClient } from "@/lib/supabase-server";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { roomName, identity } = await req.json();

    if (!roomName || !identity) {
      return NextResponse.json({ error: "Missing roomName or identity" }, { status: 400 });
    }

    // Logic for SFU access: 
    // If user is creator -> can publish.
    // If user is viewer -> can subscribe (check PPV first if gated).
    
    const { data: video } = await supabase
      .from("videos")
      .select("user_id, is_gated")
      .eq("id", roomName)
      .single();

    const isCreator = video?.user_id === user.id;
    
    if (video?.is_gated && !isCreator) {
      const { data: access } = await supabase
        .from("stream_access")
        .select("*")
        .eq("user_id", user.id)
        .eq("video_id", roomName)
        .single();
      
      if (!access) {
        return NextResponse.json({ error: "Access denied. Purchase required." }, { status: 403 });
      }
    }

    const at = new AccessToken(
      process.env.LIVEKIT_API_KEY!,
      process.env.LIVEKIT_API_SECRET!,
      {
        identity: identity,
      }
    );

    at.addGrant({
      room: roomName,
      roomJoin: true,
      canPublish: isCreator,
      canSubscribe: true,
    });

    const token = await at.toJwt();

    return NextResponse.json({ token });
  } catch (error: any) {
    console.error("LiveKit token error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
