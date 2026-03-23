import { createClient } from "@/lib/supabase-server";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ hasAccess: false }, { status: 401 });
    }

    const { videoId } = await req.json();

    // 1. Check if it's the creator
    const { data: video } = await supabase
      .from("videos")
      .select("user_id, is_gated")
      .eq("id", videoId)
      .single();

    if (video?.user_id === user.id || !video?.is_gated) {
      return NextResponse.json({ hasAccess: true });
    }

    // 2. Check for explicit access record (PPV)
    const { data: access } = await supabase
      .from("stream_access")
      .select("*")
      .eq("user_id", user.id)
      .eq("video_id", videoId)
      .single();

    if (access) {
      return NextResponse.json({ hasAccess: true });
    }

    // 3. Check for active subscription to creator
    const { data: sub } = await supabase
      .from("creator_subscriptions")
      .select("*")
      .eq("user_id", user.id)
      .eq("creator_id", video.user_id)
      .eq("status", "active")
      .single();

    return NextResponse.json({ hasAccess: !!sub });
  } catch (error) {
    return NextResponse.json({ hasAccess: false }, { status: 500 });
  }
}
