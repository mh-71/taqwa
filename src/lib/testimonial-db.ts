// ===== Testimonial database layer (Cloudflare D1) =====
// All queries for the customer review system.

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

export interface Testimonial {
  id: number;
  name: string;
  location: string | null;
  rating: number;
  review: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  updated_at: string;
}

export async function getApprovedTestimonials(db: D1Database): Promise<Testimonial[]> {
  if (!db) return [];

  const result = await db
    .prepare(`
      SELECT id, name, location, rating, review, status, created_at, updated_at
      FROM testimonials
      WHERE status = 'approved'
      ORDER BY created_at DESC
      LIMIT 100
    `)
    .all<Testimonial>();

  return result.results ?? [];
}

export async function getAllTestimonials(
  db: D1Database,
  filters?: { status?: string }
): Promise<Testimonial[]> {
  if (!db) return [];

  let query = `
    SELECT id, name, location, rating, review, status, created_at, updated_at
    FROM testimonials
  `;

  if (filters?.status) {
    query += ` WHERE status = '${filters.status}'`;
  }

  query += ` ORDER BY created_at DESC LIMIT 1000`;

  const result = await db.prepare(query).all<Testimonial>();
  return result.results ?? [];
}

export async function getTestimonialById(
  db: D1Database,
  id: number
): Promise<Testimonial | null> {
  if (!db) return null;

  const result = await db
    .prepare(`
      SELECT id, name, location, rating, review, status, created_at, updated_at
      FROM testimonials
      WHERE id = ?
    `)
    .bind(id)
    .first<Testimonial>();

  return result ?? null;
}

export async function createTestimonial(
  db: D1Database,
  data: {
    name: string;
    location?: string;
    rating: number;
    review: string;
  }
): Promise<number> {
  if (!db) throw new Error('Database not available');

  const result = await db
    .prepare(`
      INSERT INTO testimonials (name, location, rating, review, status)
      VALUES (?, ?, ?, ?, 'pending')
    `)
    .bind(data.name, data.location || null, data.rating, data.review)
    .run();

  return result.meta.last_row_id;
}

export async function updateTestimonialStatus(
  db: D1Database,
  id: number,
  status: 'pending' | 'approved' | 'rejected'
): Promise<boolean> {
  if (!db) throw new Error('Database not available');

  const result = await db
    .prepare(`
      UPDATE testimonials
      SET status = ?, updated_at = datetime('now')
      WHERE id = ?
    `)
    .bind(status, id)
    .run();

  return result.success && result.meta.changes > 0;
}

export async function deleteTestimonial(db: D1Database, id: number): Promise<boolean> {
  if (!db) throw new Error('Database not available');

  const result = await db
    .prepare(`DELETE FROM testimonials WHERE id = ?`)
    .bind(id)
    .run();

  return result.success && result.meta.changes > 0;
}

export async function getTestimonialStats(
  db: D1Database
): Promise<{ count: number; avgRating: number }> {
  if (!db) return { count: 0, avgRating: 0 };

  const result = await db
    .prepare(`
      SELECT COUNT(*) as count, AVG(rating) as avgRating
      FROM testimonials
      WHERE status = 'approved'
    `)
    .first<{ count: number; avgRating: number }>();

  return result ?? { count: 0, avgRating: 0 };
}
