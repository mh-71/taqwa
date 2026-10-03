-- Taqwa Automobile Contact Messages System — D1 schema
--
-- Apply with:
--   npx wrangler d1 execute taqwa-blog --remote --file=./migrations/0007_add_contact_messages.sql
-- (or use --local for local development)
--
-- This creates the contact_messages table for the public contact form submission system
-- and contact_audit_log table for tracking all admin actions on messages.
-- Soft deletes are supported (30-day recovery window) and full audit trail maintained.

CREATE TABLE IF NOT EXISTS contact_messages (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  name              TEXT NOT NULL,
  phone_number      TEXT NOT NULL,
  email             TEXT NOT NULL,
  service_interest  TEXT NOT NULL,
  message           TEXT NOT NULL,
  status            TEXT NOT NULL DEFAULT 'new'
                    CHECK (status IN ('new', 'read', 'replied', 'spam')),
  email_sent_at     TEXT,
  email_failed_at   TEXT,
  email_attempts    INTEGER NOT NULL DEFAULT 0,
  deleted_at        TEXT,
  created_at        TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at        TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS contact_audit_log (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  message_id        INTEGER NOT NULL,
  action            TEXT NOT NULL
                    CHECK (action IN (
                      'created',
                      'status_changed',
                      'email_sent',
                      'email_failed',
                      'deleted',
                      'restored',
                      'email_retried'
                    )),
  old_value         TEXT,
  new_value         TEXT,
  admin_id          TEXT,
  admin_name        TEXT,
  details           TEXT,
  created_at        TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Indexes for contact_messages
CREATE INDEX IF NOT EXISTS idx_contact_messages_status
ON contact_messages(status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_contact_messages_phone
ON contact_messages(phone_number);

CREATE INDEX IF NOT EXISTS idx_contact_messages_email
ON contact_messages(email);

CREATE INDEX IF NOT EXISTS idx_contact_messages_created
ON contact_messages(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_contact_messages_deleted
ON contact_messages(deleted_at);

-- Indexes for contact_audit_log
CREATE INDEX IF NOT EXISTS idx_audit_log_message_id
ON contact_audit_log(message_id);

CREATE INDEX IF NOT EXISTS idx_audit_log_action
ON contact_audit_log(action, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_audit_log_created
ON contact_audit_log(created_at DESC);
