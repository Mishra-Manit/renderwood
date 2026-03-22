import { describe, expect, it } from "vitest";
import {
  VideoStyle,
  listStyles,
  getStyleConfig,
  STYLE_CONFIGS,
} from "../agent/video-styles.js";

describe("video-styles", () => {
  it("listStyles returns all styles with correct shape", () => {
    const styles = listStyles();
    expect(styles).toHaveLength(Object.keys(STYLE_CONFIGS).length);
    for (const s of styles) {
      expect(s).toHaveProperty("value");
      expect(s).toHaveProperty("label");
      expect(s).toHaveProperty("description");
    }
  });

  it("listStyles includes general and trailer", () => {
    const values = listStyles().map((s) => s.value);
    expect(values).toContain("general");
    expect(values).toContain("trailer");
  });

  it("getStyleConfig returns config for each style", () => {
    for (const style of Object.values(VideoStyle)) {
      const cfg = getStyleConfig(style);
      expect(cfg.label).toBeTruthy();
      expect(typeof cfg.description).toBe("string");
      expect(typeof cfg.systemPromptAddendum).toBe("string");
    }
  });

  it("trailer style has non-empty addendum", () => {
    const cfg = getStyleConfig(VideoStyle.TRAILER);
    expect(cfg.systemPromptAddendum.length).toBeGreaterThan(0);
    expect(cfg.systemPromptAddendum).toContain("Trailer");
  });

  it("general style has empty addendum", () => {
    const cfg = getStyleConfig(VideoStyle.GENERAL);
    expect(cfg.systemPromptAddendum).toBe("");
  });
});
