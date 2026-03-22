import * as logfire from "@pydantic/logfire-node";
import { trace, DiagLogLevel } from "@opentelemetry/api";
import { config } from "./config.js";

let configured = false;

export function configureObservability() {
  if (configured) return;
  configured = true;

  // Disable the default OTLP exporter so only the Logfire SDK's own
  // authenticated exporter sends traces. Without this, the OTel SDK also
  // spins up a default exporter to localhost:4318 (or wherever
  // OTEL_EXPORTER_OTLP_ENDPOINT points) which either ECONNREFUSED or 400s.
  if (!process.env.OTEL_TRACES_EXPORTER) {
    process.env.OTEL_TRACES_EXPORTER = "none";
  }
  if (!process.env.OTEL_METRICS_EXPORTER) {
    process.env.OTEL_METRICS_EXPORTER = "none";
  }
  if (!process.env.OTEL_LOGS_EXPORTER) {
    process.env.OTEL_LOGS_EXPORTER = "none";
  }

  logfire.configure({
    serviceName: "renderwood-agent",
    serviceVersion: "0.1.0",
    sendToLogfire: true,
    console: config.environment === "development",
    // WARN suppresses the informational "OTEL_LOGS_EXPORTER contains none"
    // message from @opentelemetry/sdk-node while still surfacing real warnings.
    diagLogLevel:
      config.environment === "development" ? DiagLogLevel.WARN : undefined,
    // Disable the logfire metric reader. The SDK passes the deprecated
    // `metricReader` (singular) option to NodeSDK — setting this to false
    // avoids it entirely. We only need traces, not OTEL metrics.
    metrics: false,
  });
}

export const tracer = trace.getTracer("claude-agent-sdk");

export async function withSpan<T>(
  name: string,
  attrs: Record<string, unknown>,
  fn: () => Promise<T>,
): Promise<T> {
  return logfire.span(name, { attributes: attrs, callback: async () => fn() });
}

export { logfire };
