/**
 * Audit log utility — P14 Audit Logging
 *
 * Pure function that creates structured audit log entry objects.
 * Does NOT write to a database — that responsibility belongs to the
 * server-side route handler that calls this function.
 */

export type AuditEventType =
  | 'login'
  | 'logout'
  | 'register'
  | 'password_reset'
  | 'consent_update';

export interface AuditLogEntry {
  id: string;
  event_type: AuditEventType;
  user_id: string;
  ip_address: string;
  timestamp: string;
  metadata: Record<string, unknown>;
}

export interface CreateAuditLogInput {
  event_type: AuditEventType;
  user_id: string;
  ip_address: string;
  metadata?: Record<string, unknown>;
}

let counter = 0;

function generateId(): string {
  counter += 1;
  return `audit-${Date.now()}-${counter}-${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * Creates an audit log entry object with the correct shape.
 * The caller is responsible for persisting this entry.
 */
export function createAuditLogEntry(input: CreateAuditLogInput): AuditLogEntry {
  return {
    id: generateId(),
    event_type: input.event_type,
    user_id: input.user_id,
    ip_address: input.ip_address,
    timestamp: new Date().toISOString(),
    metadata: input.metadata ?? {},
  };
}
