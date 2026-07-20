import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createAuditLogEntry, type AuditEventType, type AuditLogEntry } from '../lib/audit/auditLog';

describe('auditLog utility — P14 Audit Logging', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-07-20T12:00:00.000Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('creates a log entry with correct shape for login event', () => {
    const entry = createAuditLogEntry({
      event_type: 'login',
      user_id: 'user-123',
      ip_address: '192.168.1.1',
    });

    expect(entry).toEqual({
      id: expect.any(String),
      event_type: 'login',
      user_id: 'user-123',
      ip_address: '192.168.1.1',
      timestamp: '2026-07-20T12:00:00.000Z',
      metadata: {},
    });
  });

  it('creates a log entry with correct shape for logout event', () => {
    const entry = createAuditLogEntry({
      event_type: 'logout',
      user_id: 'user-456',
      ip_address: '10.0.0.1',
    });

    expect(entry.event_type).toBe('logout');
    expect(entry.user_id).toBe('user-456');
    expect(entry.ip_address).toBe('10.0.0.1');
    expect(entry.id).toBeTruthy();
    expect(entry.timestamp).toBe('2026-07-20T12:00:00.000Z');
  });

  it('creates a log entry for password_reset event', () => {
    const entry = createAuditLogEntry({
      event_type: 'password_reset',
      user_id: 'user-789',
      ip_address: '172.16.0.1',
    });

    expect(entry.event_type).toBe('password_reset');
  });

  it('creates a log entry for register event', () => {
    const entry = createAuditLogEntry({
      event_type: 'register',
      user_id: 'user-new',
      ip_address: '203.0.113.5',
    });

    expect(entry.event_type).toBe('register');
  });

  it('creates a log entry for consent_update event', () => {
    const entry = createAuditLogEntry({
      event_type: 'consent_update',
      user_id: 'user-consent',
      ip_address: '198.51.100.1',
      metadata: { changed_fields: ['full_profile'] },
    });

    expect(entry.event_type).toBe('consent_update');
    expect(entry.metadata).toEqual({ changed_fields: ['full_profile'] });
  });

  it('generates unique IDs for each entry', () => {
    const a = createAuditLogEntry({
      event_type: 'login',
      user_id: 'user-1',
      ip_address: '1.1.1.1',
    });
    const b = createAuditLogEntry({
      event_type: 'login',
      user_id: 'user-1',
      ip_address: '1.1.1.1',
    });

    expect(a.id).not.toBe(b.id);
  });

  it('includes optional metadata when provided', () => {
    const entry = createAuditLogEntry({
      event_type: 'login',
      user_id: 'user-meta',
      ip_address: '8.8.8.8',
      metadata: { user_agent: 'Mozilla/5.0', method: 'password' },
    });

    expect(entry.metadata).toEqual({
      user_agent: 'Mozilla/5.0',
      method: 'password',
    });
  });

  it('defaults metadata to empty object when not provided', () => {
    const entry = createAuditLogEntry({
      event_type: 'logout',
      user_id: 'user-no-meta',
      ip_address: '127.0.0.1',
    });

    expect(entry.metadata).toEqual({});
  });

  it('validates required fields are present in the output', () => {
    const entry = createAuditLogEntry({
      event_type: 'login',
      user_id: 'user-validate',
      ip_address: '10.10.10.10',
    });

    const requiredKeys: (keyof AuditLogEntry)[] = [
      'id',
      'event_type',
      'user_id',
      'ip_address',
      'timestamp',
      'metadata',
    ];

    for (const key of requiredKeys) {
      expect(entry).toHaveProperty(key);
    }
  });
});
