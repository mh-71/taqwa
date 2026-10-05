-- Contact Message Replies — D1 schema
--
-- Apply with:
--   npx wrangler d1 execute taqwa-blog --remote --file=./migrations/0008_add_message_replies.sql
-- (or use --local for local development)
--
-- This creates the contact_message_replies table for storing individual replies sent by admins
-- to contact messages. Maintains complete reply history with full subject, body, and metadata.

CREATE TABLE IF NOT EXISTS contact_message_replies (
  id                    INTEGER PRIMARY KEY AUTOINCREMENT,

  -- Relationship to contact message
  contact_message_id    INTEGER NOT NULL,

  -- Email recipient and content
  to_email              TEXT NOT NULL,
  subject               TEXT NOT NULL,
  body                  TEXT NOT NULL,

  -- Email delivery status
  status                TEXT NOT NULL DEFAULT 'pending'
                        CHECK (status IN ('sent', 'bounced', 'failed', 'pending')),

  -- Email provider information
  provider_message_id   TEXT,

  -- Idempotency key for preventing duplicate sends
  idempotency_key       TEXT,

  -- Timestamps
  sent_at               TEXT,
  created_at            TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at            TEXT NOT NULL DEFAULT (datetime('now')),

  -- Soft delete support
  deleted_at            TEXT,

  -- Foreign key constraint
  FOREIGN KEY (contact_message_id) REFERENCES contact_messages(id)
);

-- Indexes for efficient query patterns
CREATE INDEX IF NOT EXISTS idx_reply_message_id
  ON contact_message_replies(contact_message_id);

CREATE INDEX IF NOT EXISTS idx_reply_message_created
  ON contact_message_replies(contact_message_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_reply_sent_at
  ON contact_message_replies(sent_at DESC);

CREATE INDEX IF NOT EXISTS idx_reply_created
  ON contact_message_replies(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_reply_deleted
  ON contact_message_replies(deleted_at);

-- Unique index on idempotency key to prevent duplicate sends (NULL values allowed)
CREATE UNIQUE INDEX IF NOT EXISTS idx_reply_idempotency_key
  ON contact_message_replies(idempotency_key)
  WHERE idempotency_key IS NOT NULL;

-- Unique index on provider message ID to detect duplicate email provider responses
CREATE UNIQUE INDEX IF NOT EXISTS idx_reply_provider_message_id
  ON contact_message_replies(provider_message_id)
  WHERE provider_message_id IS NOT NULL;
