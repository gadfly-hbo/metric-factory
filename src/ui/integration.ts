import type { IncomingMessage, ServerResponse } from "node:http";
import type { LlmClient } from "../llm/types.js";
import type { ReleaseResult } from "../sap/release.js";

/** Explicit embedding capabilities. The standalone entry never constructs these. */
export interface UiIntegration {
  userMethodsDir: string;
  userTemplatesDir: string;
  modelLabel: string;
  reviewer: string;
  configured(): boolean;
  jobStarted?(taskId: string): void;
  /** Caller owns admission, accounting and the actual runtime AbortSignal. */
  client(taskId: string, signal: AbortSignal): Promise<LlmClient>;
  /** Called again immediately before claiming a result write. */
  authorizePublication(taskId: string): Promise<void>;
  /** Unknown usage/effects must remain unknown after cancellation or restart. */
  settled(taskId: string): Promise<boolean>;
  guard(req: IncomingMessage, res: ServerResponse): Promise<boolean>;
  requestFinished?(req: IncomingMessage): void;
  published(result: ReleaseResult): Promise<void>;
  recoverPublished(packageId: string, version: string): Promise<void>;
  publicationSaved(packageId: string, version: string): Promise<boolean>;
  exportPublished(packageId: string, version: string): Promise<{bytes: Uint8Array; filename: string}>;
}

export type CancellationState = "requested" | "stopped" | "completed" | "failed" | "unknown";

/** One logical job; cancellation and publication have one synchronous winner. */
export class IntegratedJob {
  readonly controller = new AbortController();
  private publishing = false;
  private finished = false;
  private known = false;
  constructor(readonly id: string, private readonly integration: Pick<UiIntegration, "authorizePublication" | "settled">) {}
  async claimPublication(): Promise<void> {
    this.controller.signal.throwIfAborted();
    await this.integration.authorizePublication(this.id);
    this.controller.signal.throwIfAborted();
    this.publishing = true;
  }
  cancel(): CancellationState {
    if (!this.publishing && !this.finished) this.controller.abort();
    return this.state();
  }
  async finish(): Promise<void> {
    try { this.known = await this.integration.settled(this.id); }
    catch { this.known = false; }
    this.finished = true;
  }
  state(): CancellationState {
    if (!this.finished) return "requested";
    if (!this.known) return "unknown";
    return this.controller.signal.aborted ? "stopped" : this.publishing ? "completed" : "failed";
  }
  get active(): boolean { return !this.finished; }
}
