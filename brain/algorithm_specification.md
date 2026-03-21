# Vibe-Rank Algorithm Specification

Vibe-Rank is a dynamic scoring and recommendation system designed to surface high-quality content and adapt to user preferences in real-time.

## 1. Quality Sensing (Agent: QA-Sensor)
The system programmatically evaluates the technical quality of every video during the processing stage.

| Metric | Weight | Threshold for "High Quality" |
| :--- | :--- | :--- |
| **Resolution** | 40% | 1080p (1920x1080) or higher. |
| **Bitrate** | 30% | 5Mbps+ for 1080p; 10Mbps+ for 4K. |
| **Audio Quality** | 20% | AAC 128kbps+ with clear signal-to-noise ratio. |
| **Framerate** | 10% | 30fps stable; bonus for 60fps. |

**Output**: A `quality_score` (0.0 - 1.0) stored on the `videos` table.

## 2. Discovery Velocity (Agent: Trend-Hunter)
Instead of ranking by total views, we rank by **Velocity** to solve the "Cold Start" problem.

- **Velocity Calculation**: `V = (Views_Now - Views_1hr_Ago) / (1 + Time_Since_Upload^1.5)`
- This formula aggressively boosts new videos during their first 24 hours but allows sustained quality content to trend if engagement stays high.

## 3. Personalization Layer (Agent: Vibe-Learner)
The "For You" experience builds a per-user interest profile based on:
1.  **Watch Time**: High weight on videos watched >70%.
2.  **Category Affinity**: Aggregates time spent in `Gaming`, `Tech`, `Lifestyle`, etc.
3.  **Interaction**: Likes, Shares, and Comments provide explicit preference signals.

## 4. Multi-Agent Evolution Path
- **Phase 1 (Now)**: Hardcoded weights and technical metadata capture.
- **Phase 2 (+3 Months)**: Agent-driven weight adjustment based on site-wide retention data.
- **Phase 3 (+6 Months)**: Predictive pre-loading of "For You" content for instant playback.

## 👥 Agent Responsibilities
- **Agent QA-Sensor**: populates `width`, `height`, `bitrate`.
- **Agent Topic-Hunter**: clusters tags and titles to find "hidden" trends.
- **Agent Vibe-Learner**: maps user IDs to category preference vectors.
