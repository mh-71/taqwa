// ===== Contact Messages Database Layer (Cloudflare D1) =====
// All queries for the contact message system.

export interface D1Result<T = unknown> {
  results: T[];
  success: boolean;
}

export interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement;
  first<T = unknown>(col?: string): Promise<T | null>;
  all<T = unknown>(): Promise<D1Result<T>>;
  run(): Promise<{ success: boolean; meta: { last_row_id: number; changes: number } }>;
}

export interface D1Database {
  prepare(query: string): D1PreparedStatement;
}

export interface ContactMessage {
  id: number;
  name: string;
  phone_number: string;
  email: string;
  service_interest: string;
  message: string;
  status: 'new' | 'read' | 'replied' | 'spam';
  email_sent_at: string | null;
  email_failed_at: string | null;
  email_attempts: number;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface AuditLog {
  id: number;
  message_id: number;
  action: 'created' | 'status_changed' | 'email_sent' | 'email_failed' | 'deleted' | 'restored' | 'email_retried';
  old_value: string | null;
  new_value: string | null;
  admin_id: string | null;
  admin_name: string | null;
  details: string | null;
  created_at: string;
}

// ===== Validation & Normalization =====

export function normalizePhoneNumber(phone: string): string {
  const digits = phone.replace(/\D/g, '');

  if (!/^01\d{9}$/.test(digits)) {
    throw new Error('Invalid phone number format');
  }

  return digits;
}

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function validateContactMessage(data: {
  name?: string;
  phoneNumber?: string;
  email?: string;
  serviceInterest?: string;
  message?: string;
}): {
  name: string;
  phoneNumber: string;
  email: string;
  serviceInterest: string;
  message: string;
} {
  const name = (data.name || '').trim();
  if (name.length < 2 || name.length > 100) {
    throw new Error('Name must be 2-100 characters');
  }

  const phoneNumber = normalizePhoneNumber(data.phoneNumber || '');

  const email = (data.email || '').trim();
  if (!validateEmail(email)) {
    throw new Error('Invalid email format');
  }

  const serviceInterest = data.serviceInterest || '';
  const validServices = ['lpg-cng', 'engine', 'ac', 'hybrid', 'carwash', 'other'];
  if (!validServices.includes(serviceInterest)) {
    throw new Error('Invalid service interest');
  }

  const message = (data.message || '').trim();
  if (message.length < 100 || message.length > 5000) {
    throw new Error('Message must be 100-5000 characters');
  }

  return { name, phoneNumber, email, serviceInterest, message };
}

// ===== Database Queries =====

export async function createContactMessage(
  db: D1Database,
  data: {
    name: string;
    phone_number: string;
    email: string;
    service_interest: string;
    message: string;
  }
): Promise<number> {
  if (!db) throw new Error('Database not available');

  const result = await db
    .prepare(`
      INSERT INTO contact_messages (
        name, phone_number, email, service_interest, message, status
      )
      VALUES (?, ?, ?, ?, ?, 'new')
    `)
    .bind(
      data.name,
      data.phone_number,
      data.email,
      data.service_interest,
      data.message
    )
    .run();

  return result.meta.last_row_id;
}

export async function getContactMessageById(
  db: D1Database,
  id: number
): Promise<ContactMessage | null> {
  if (!db) return null;

  const result = await db
    .prepare(`
      SELECT id, name, phone_number, email, service_interest, message,
             status, email_sent_at, email_failed_at, email_attempts,
             deleted_at, created_at, updated_at
      FROM contact_messages
      WHERE id = ?
    `)
    .bind(id)
    .first<ContactMessage>();

  return result ?? null;
}

export async function listContactMessages(
  db: D1Database,
  options?: {
    status?: string;
    search?: string;
    limit?: number;
    offset?: number;
  }
): Promise<{ messages: ContactMessage[]; total: number; statusCounts: Record<string, number> }> {
  if (!db) return { messages: [], total: 0, statusCounts: {} };

  const status = options?.status || '';
  const search = (options?.search || '').trim();
  const limit = Math.min(Math.max(options?.limit || 20, 1), 100);
  const offset = Math.max(options?.offset || 0, 0);
  const hasSearch = search.length > 0;
  const searchTerm = hasSearch ? `%${search}%` : '';

  let messageQuery = `
    SELECT id, name, phone_number, email, service_interest, message,
           status, email_sent_at, email_failed_at, email_attempts,
           deleted_at, created_at, updated_at
    FROM contact_messages
    WHERE deleted_at IS NULL
      AND (status = ? OR ? = '')
  `;

  let countQuery = `
    SELECT COUNT(*) as cnt FROM contact_messages
    WHERE deleted_at IS NULL
      AND (status = ? OR ? = '')
  `;

  let bindings = [status, status];

  if (hasSearch) {
    messageQuery += `
      AND (
        name LIKE ?
        OR email LIKE ?
        OR phone_number LIKE ?
        OR message LIKE ?
      )
    `;
    countQuery += `
      AND (
        name LIKE ?
        OR email LIKE ?
        OR phone_number LIKE ?
        OR message LIKE ?
      )
    `;
    bindings.push(searchTerm, searchTerm, searchTerm, searchTerm);
  }

  messageQuery += ` ORDER BY created_at DESC LIMIT ? OFFSET ? `;
  bindings.push(limit, offset);

  const result = await db
    .prepare(messageQuery)
    .bind(...(bindings as unknown[]))
    .all<ContactMessage>();

  const countBindings = bindings.slice(0, -2) as unknown[];
  const totalResult = await db
    .prepare(countQuery)
    .bind(...countBindings)
    .first<{ cnt: number}>();

  const countsResult = await db
    .prepare(`
      SELECT status, COUNT(*) as cnt FROM contact_messages
      WHERE deleted_at IS NULL
      GROUP BY status
    `)
    .all<{ status: string; cnt: number}>();

  const statusCounts: Record<string, number> = {
    new: 0,
    read: 0,
    replied: 0,
    spam: 0,
  };

  for (const row of countsResult.results) {
    statusCounts[row.status] = row.cnt;
  }

  return {
    messages: result.results,
    total: totalResult?.cnt ?? 0,
    statusCounts,
  };
}

export async function getDeletedMessages(
  db: D1Database,
  options?: {
    limit?: number;
    offset?: number;
  }
): Promise<{ messages: ContactMessage[]; total: number }> {
  if (!db) return { messages: [], total: 0 };

  const limit = Math.min(Math.max(options?.limit || 20, 1), 100);
  const offset = Math.max(options?.offset || 0, 0);

  const result = await db
    .prepare(`
      SELECT id, name, phone_number, email, service_interest, message,
             status, email_sent_at, email_failed_at, email_attempts,
             deleted_at, created_at, updated_at
      FROM contact_messages
      WHERE deleted_at IS NOT NULL
      ORDER BY deleted_at DESC
      LIMIT ? OFFSET ?
    `)
    .bind(limit, offset)
    .all<ContactMessage>();

  const totalResult = await db
    .prepare(`
      SELECT COUNT(*) as cnt FROM contact_messages
      WHERE deleted_at IS NOT NULL
    `)
    .first<{ cnt: number}>();

  return {
    messages: result.results,
    total: totalResult?.cnt ?? 0,
  };
}

export async function checkDuplicateSubmission(
  db: D1Database,
  phoneNumber: string
): Promise<boolean> {
  if (!db) return false;

  const result = await db
    .prepare(`
      SELECT COUNT(*) as cnt FROM contact_messages
      WHERE phone_number = ?
        AND status != 'spam'
        AND created_at > datetime('now', '-24 hours')
    `)
    .bind(phoneNumber)
    .first<{ cnt: number}>();

  return (result?.cnt ?? 0) > 0;
}

export async function updateContactStatus(
  db: D1Database,
  id: number,
  newStatus: 'new' | 'read' | 'replied' | 'spam'
): Promise<{ success: boolean; oldStatus?: string }> {
  if (!db) return { success: false };

  const message = await getContactMessageById(db, id);
  if (!message) return { success: false };

  if (message.deleted_at !== null) {
    throw new Error('Cannot modify deleted message');
  }

  const oldStatus = message.status;

  const result = await db
    .prepare(`
      UPDATE contact_messages
      SET status = ?, updated_at = datetime('now')
      WHERE id = ? AND deleted_at IS NULL
    `)
    .bind(newStatus, id)
    .run();

  return {
    success: result.success && result.meta.changes > 0,
    oldStatus,
  };
}

export async function softDeleteContactMessage(
  db: D1Database,
  id: number
): Promise<boolean> {
  if (!db) return false;

  const message = await getContactMessageById(db, id);
  if (!message) return false;

  if (message.deleted_at !== null) {
    throw new Error('Message already deleted');
  }

  const result = await db
    .prepare(`
      UPDATE contact_messages
      SET deleted_at = datetime('now'), updated_at = datetime('now')
      WHERE id = ?
    `)
    .bind(id)
    .run();

  return result.success && result.meta.changes > 0;
}

export async function restoreContactMessage(
  db: D1Database,
  id: number
): Promise<boolean> {
  if (!db) return false;

  const message = await getContactMessageById(db, id);
  if (!message) return false;

  if (message.deleted_at === null) {
    throw new Error('Message is not deleted');
  }

  const result = await db
    .prepare(`
      UPDATE contact_messages
      SET deleted_at = NULL, updated_at = datetime('now')
      WHERE id = ?
    `)
    .bind(id)
    .run();

  return result.success && result.meta.changes > 0;
}

export async function updateEmailStatus(
  db: D1Database,
  id: number,
  status: 'sent' | 'failed'
): Promise<boolean> {
  if (!db) return false;

  if (status === 'sent') {
    const result = await db
      .prepare(`
        UPDATE contact_messages
        SET email_sent_at = datetime('now'),
            email_failed_at = NULL,
            email_attempts = email_attempts + 1,
            updated_at = datetime('now')
        WHERE id = ?
      `)
      .bind(id)
      .run();

    return result.success && result.meta.changes > 0;
  } else {
    const result = await db
      .prepare(`
        UPDATE contact_messages
        SET email_failed_at = datetime('now'),
            email_attempts = email_attempts + 1,
            updated_at = datetime('now')
        WHERE id = ?
      `)
      .bind(id)
      .run();

    return result.success && result.meta.changes > 0;
  }
}

export async function logAuditAction(
  db: D1Database,
  messageId: number,
  action: AuditLog['action'],
  oldValue?: string | null,
  newValue?: string | null,
  adminId?: string | null,
  adminName?: string | null,
  details?: string | null
): Promise<boolean> {
  if (!db) return false;

  const result = await db
    .prepare(`
      INSERT INTO contact_audit_log (
        message_id, action, old_value, new_value, admin_id, admin_name, details
      )
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `)
    .bind(
      messageId,
      action,
      oldValue ?? null,
      newValue ?? null,
      adminId ?? null,
      adminName ?? null,
      details ?? null
    )
    .run();

  return result.success;
}

export async function getAuditLogsForMessage(
  db: D1Database,
  messageId: number,
  limit = 50
): Promise<AuditLog[]> {
  if (!db) return [];

  const result = await db
    .prepare(`
      SELECT id, message_id, action, old_value, new_value, admin_id, admin_name, details, created_at
      FROM contact_audit_log
      WHERE message_id = ?
      ORDER BY created_at DESC
      LIMIT ?
    `)
    .bind(messageId, limit)
    .all<AuditLog>();

  return result.results;
}
