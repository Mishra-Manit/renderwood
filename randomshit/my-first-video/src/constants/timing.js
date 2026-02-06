export const SCENE_DURATIONS = {
  TERMINAL: 120,      // 4s
  HOME: 150,          // 5s
  CHAT: 160,          // 5.3s
  PROVIDER: 130,      // 4.3s
  MCP: 140,           // 4.7s
  MESSAGING: 120,     // 4s
  LOGO: 180,          // 6s
  CTA: 120,           // 4s
};

export const TRANSITION_DURATION = 15; // 0.5s overlap

export const getSceneStart = (sceneIndex) => {
  const scenes = Object.values(SCENE_DURATIONS);
  return scenes
    .slice(0, sceneIndex)
    .reduce((acc, duration) => acc + duration - TRANSITION_DURATION, 0);
};

export const TOTAL_FRAMES = Object.values(SCENE_DURATIONS)
  .reduce((acc, dur) => acc + dur, 0) - (7 * TRANSITION_DURATION); // 1110 frames
