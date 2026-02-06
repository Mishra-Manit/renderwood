import React from 'react';
import { Audio, staticFile, AbsoluteFill, interpolate, useCurrentFrame, Sequence } from 'remotion';
import Scene1_TerminalInstall from './scenes/Scene1_TerminalInstall';
import Scene2_HomeScreen from './scenes/Scene2_HomeScreen';
import Scene3_ChatInterface from './scenes/Scene3_ChatInterface';
import Scene4_ProviderSwitch from './scenes/Scene4_ProviderSwitch';
import Scene5_MCPCatalog from './scenes/Scene5_MCPCatalog';
import Scene6_MessagingBots from './scenes/Scene6_MessagingBots';
import Scene7_LogoCombo from './scenes/Scene7_LogoCombo';
import Scene8_GitHubCTA from './scenes/Scene8_GitHubCTA';
import { SCENE_DURATIONS, TRANSITION_DURATION } from './constants/timing';
import { colors } from './constants/colors';

export const OpenClawdVideo = () => {
  const frame = useCurrentFrame();

  const audioVolume = (f) => {
    if (f < 30) return interpolate(f, [0, 30], [0, 0.4], { extrapolateRight: 'clamp' });
    if (f < 1050) return 0.4;
    return interpolate(f, [1050, 1110], [0.4, 0], { extrapolateRight: 'clamp' });
  };

  const sceneStarts = {
    terminal: 0,
    home: SCENE_DURATIONS.TERMINAL,
    chat: SCENE_DURATIONS.TERMINAL + SCENE_DURATIONS.HOME,
    provider: SCENE_DURATIONS.TERMINAL + SCENE_DURATIONS.HOME + SCENE_DURATIONS.CHAT,
    mcp: SCENE_DURATIONS.TERMINAL + SCENE_DURATIONS.HOME + SCENE_DURATIONS.CHAT + SCENE_DURATIONS.PROVIDER,
    messaging: SCENE_DURATIONS.TERMINAL + SCENE_DURATIONS.HOME + SCENE_DURATIONS.CHAT + SCENE_DURATIONS.PROVIDER + SCENE_DURATIONS.MCP,
    logo: SCENE_DURATIONS.TERMINAL + SCENE_DURATIONS.HOME + SCENE_DURATIONS.CHAT + SCENE_DURATIONS.PROVIDER + SCENE_DURATIONS.MCP + SCENE_DURATIONS.MESSAGING,
    cta: SCENE_DURATIONS.TERMINAL + SCENE_DURATIONS.HOME + SCENE_DURATIONS.CHAT + SCENE_DURATIONS.PROVIDER + SCENE_DURATIONS.MCP + SCENE_DURATIONS.MESSAGING + SCENE_DURATIONS.LOGO,
  };

  return (
    <AbsoluteFill style={{ backgroundColor: colors.bg }}>
      {/* Audio file not included - add headphonk.mp3 to public/audio/ to enable */}
      {/* <Audio
        src={staticFile('audio/headphonk.mp3')}
        volume={audioVolume(frame)}
      /> */}

      <Sequence from={sceneStarts.terminal} durationInFrames={SCENE_DURATIONS.TERMINAL}>
        <Scene1_TerminalInstall />
      </Sequence>

      <Sequence from={sceneStarts.home} durationInFrames={SCENE_DURATIONS.HOME}>
        <Scene2_HomeScreen />
      </Sequence>

      <Sequence from={sceneStarts.chat} durationInFrames={SCENE_DURATIONS.CHAT}>
        <Scene3_ChatInterface />
      </Sequence>

      <Sequence from={sceneStarts.provider} durationInFrames={SCENE_DURATIONS.PROVIDER}>
        <Scene4_ProviderSwitch />
      </Sequence>

      <Sequence from={sceneStarts.mcp} durationInFrames={SCENE_DURATIONS.MCP}>
        <Scene5_MCPCatalog />
      </Sequence>

      <Sequence from={sceneStarts.messaging} durationInFrames={SCENE_DURATIONS.MESSAGING}>
        <Scene6_MessagingBots />
      </Sequence>

      <Sequence from={sceneStarts.logo} durationInFrames={SCENE_DURATIONS.LOGO}>
        <Scene7_LogoCombo />
      </Sequence>

      <Sequence from={sceneStarts.cta} durationInFrames={SCENE_DURATIONS.CTA}>
        <Scene8_GitHubCTA />
      </Sequence>
    </AbsoluteFill>
  );
};

export default OpenClawdVideo;
