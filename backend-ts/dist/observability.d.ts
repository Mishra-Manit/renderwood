import * as logfire from "@pydantic/logfire-node";
export declare function configureObservability(): void;
export declare const tracer: import("@opentelemetry/api").Tracer;
export declare function withSpan<T>(name: string, attrs: Record<string, unknown>, fn: () => Promise<T>): Promise<T>;
export { logfire };
//# sourceMappingURL=observability.d.ts.map