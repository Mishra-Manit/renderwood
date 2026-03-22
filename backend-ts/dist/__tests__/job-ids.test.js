import { describe, expect, it } from "vitest";
import { generateJobId } from "../lib/job-ids.js";
describe("job-ids", () => {
    it("generates a ULID string", () => {
        const id = generateJobId();
        expect(id).toMatch(/^[0-9A-Z]{26}$/);
    });
    it("generates unique values", () => {
        const ids = new Set(Array.from({ length: 100 }, () => generateJobId()));
        expect(ids.size).toBe(100);
    });
});
//# sourceMappingURL=job-ids.test.js.map