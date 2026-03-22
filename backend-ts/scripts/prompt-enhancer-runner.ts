import { enhancePrompt } from "../src/agent/prompt-enhancer.js";
import { VideoStyle } from "../src/agent/video-styles.js";

const TEST_PROMPT = "A 10 second video of a sunset over the ocean with gentle waves";

async function main() {
  console.log("Testing prompt enhancement...\n");
  console.log("Input:", TEST_PROMPT);
  console.log("Style:", VideoStyle.GENERAL);
  console.log("---\n");

  const enhanced = await enhancePrompt(TEST_PROMPT, VideoStyle.GENERAL);
  console.log("Output:\n", enhanced);
}

main().catch(console.error);
