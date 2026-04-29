import { EventEmitter } from "node:events";

export type LedgerRealtimeEvent = {
  type:
    | "connected"
    | "project.updated"
    | "milestone.updated"
    | "activity.created"
    | "report.created"
    | "sync.completed";
  projectId?: string;
  activityId?: string;
  milestoneId?: string;
  timestamp: string;
};

const emitter = new EventEmitter();
const EVENT_NAME = "ledger-event";

export function publishLedgerEvent(event: Omit<LedgerRealtimeEvent, "timestamp"> & { timestamp?: string }) {
  emitter.emit(EVENT_NAME, {
    ...event,
    timestamp: event.timestamp ?? new Date().toISOString(),
  } satisfies LedgerRealtimeEvent);
}

export function subscribeToLedgerEvents(listener: (event: LedgerRealtimeEvent) => void) {
  emitter.on(EVENT_NAME, listener);
  return () => emitter.off(EVENT_NAME, listener);
}
