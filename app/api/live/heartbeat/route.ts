import { createClient } from "@/lib/supabase-server";
import { NextResponse } from "next/server";

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

    // Update heartbeat and viewer count
    const { error } = await supabase
      .from("videos")
      .update({
        viewer_count: viewerCount || 0,
        last_heartbeat: new Date().toISOString()
      })
      .eq("id", videoId)
      .eq("user_id", user.id); // Only the creator can update their own stream heartbeat

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
