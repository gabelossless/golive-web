/**
 * Zenith Stream Allocator
 * Decisions based on viewer count, user tier, and cost optimization.
 */

export type StreamRoute = "LIVEPEER_HLS" | "LIVEKIT_SFU";

export interface StreamContext {
  viewerCount: number;
  isPremium: boolean;
  requiresLowLatency?: boolean;
}

const CONSTANTS = {
  SFU_THRESHOLD: 50, // Max viewers for LiveKit SFU before switching to HLS
};

/**
 * Chooses the best streaming pipeline for a given context.
 */
export function chooseStreamRoute(ctx: StreamContext): StreamRoute {
  // If we have more than 50 viewers, always use HLS for scalability
  if (ctx.viewerCount > CONSTANTS.SFU_THRESHOLD) {
    return "LIVEPEER_HLS";
  }

  // For small audiences, SFU (LiveKit) is preferred for low latency and lower initial cost
  return "LIVEKIT_SFU";
}

/**
 * Checks if a stream should be upgraded or downgraded mid-flight.
 */
export function shouldSwitchRoute(
  current: StreamRoute,
  viewerCount: number
): StreamRoute | null {
  const next = chooseStreamRoute({ viewerCount, isPremium: true }); // Assume premium if they are live
  return next !== current ? next : null;
}

/**
 * Cost Heuristics (Estimated)
 */
export function getEstimatedCost(route: StreamRoute, viewerMinutes: number): number {
  const rates = {
    LIVEPEER_HLS: 0.0005, // ~$0.03/hour per viewer
    LIVEKIT_SFU: 0.0002,  // ~$0.012/hour per viewer
  };
  return viewerMinutes * rates[route];
}
