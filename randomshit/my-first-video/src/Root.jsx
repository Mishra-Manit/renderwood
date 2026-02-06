import React from 'react';
import { Composition, registerRoot } from 'remotion';
import { MyVideo } from './MyVideo';
import { OpenClawdVideo } from './OpenClawdVideo';

export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="MyFirstVideo"
        component={MyVideo}
        durationInFrames={150} // 5 seconds at 30fps
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="OpenClawdVideo"
        component={OpenClawdVideo}
        durationInFrames={1110} // 37 seconds at 30fps
        fps={30}
        width={1080}
        height={700}
      />
    </>
  );
};

registerRoot(RemotionRoot);
