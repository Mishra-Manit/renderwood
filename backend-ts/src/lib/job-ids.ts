import { ulid } from "ulid";

export function generateJobId(): string {
  return ulid();
}
