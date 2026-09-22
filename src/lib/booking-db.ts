// ===== Booking database layer (Cloudflare D1) =====
// All queries for the booking request system.

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

export interface Booking {
  id: number;
  name: string;
  phone_number: string;
  email: string | null;
  vehicle_make: string;
  vehicle_model: string;
  registration_no: string | null;
  service_type: string;
  preferred_date: string;
  preferred_time: string;
  message: string | null;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  created_at: string;
  updated_at: string;
}

export async function createBooking(
  db: D1Database,
  data: {
    name: string;
    phone_number: string;
    email?: string;
    vehicle_make: string;
    vehicle_model: string;
    registration_no?: string;
    service_type: string;
    preferred_date: string;
    preferred_time: string;
    message?: string;
  }
): Promise<number> {
  if (!db) throw new Error('Database not available');

  const result = await db
    .prepare(`
      INSERT INTO bookings (
        name, phone_number, email, vehicle_make, vehicle_model,
        registration_no, service_type, preferred_date, preferred_time,
        message, status
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')
    `)
    .bind(
      data.name,
      data.phone_number,
      data.email || null,
      data.vehicle_make,
      data.vehicle_model,
      data.registration_no || null,
      data.service_type,
      data.preferred_date,
      data.preferred_time,
      data.message || null
    )
    .run();

  return result.meta.last_row_id;
}

export async function getBookingById(
  db: D1Database,
  id: number
): Promise<Booking | null> {
  if (!db) return null;

  const result = await db
    .prepare(`
      SELECT id, name, phone_number, email, vehicle_make, vehicle_model,
             registration_no, service_type, preferred_date, preferred_time,
             message, status, created_at, updated_at
      FROM bookings
      WHERE id = ?
    `)
    .bind(id)
    .first<Booking>();

  return result ?? null;
}

export async function getAllBookings(
  db: D1Database,
  filters?: {
    status?: string;
    search?: string;
  }
): Promise<Booking[]> {
  if (!db) return [];

  let query = `
    SELECT id, name, phone_number, email, vehicle_make, vehicle_model,
           registration_no, service_type, preferred_date, preferred_time,
           message, status, created_at, updated_at
    FROM bookings
    WHERE 1=1
  `;

  const bindValues: unknown[] = [];

  if (filters?.status) {
    query += ` AND status = ?`;
    bindValues.push(filters.status);
  }

  if (filters?.search) {
    const searchTerm = `%${filters.search}%`;
    query += ` AND (name LIKE ? OR phone_number LIKE ? OR registration_no LIKE ?)`;
    bindValues.push(searchTerm, searchTerm, searchTerm);
  }

  query += ` ORDER BY created_at DESC LIMIT 1000`;

  const stmt = db.prepare(query);

  const boundStmt =
    bindValues.length > 0
      ? stmt.bind(...bindValues)
      : stmt;

  const result = await boundStmt.all<Booking>();
  return result.results ?? [];
}

export async function updateBookingStatus(
  db: D1Database,
  id: number,
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled'
): Promise<boolean> {
  if (!db) throw new Error('Database not available');

  const result = await db
    .prepare(`
      UPDATE bookings
      SET status = ?, updated_at = datetime('now')
      WHERE id = ?
    `)
    .bind(status, id)
    .run();

  return result.success && result.meta.changes > 0;
}

export async function updateBooking(
  db: D1Database,
  id: number,
  data: {
    name?: string;
    phone_number?: string;
    email?: string;
    vehicle_make?: string;
    vehicle_model?: string;
    registration_no?: string;
    service_type?: string;
    preferred_date?: string;
    preferred_time?: string;
    message?: string;
  }
): Promise<boolean> {
  if (!db) throw new Error('Database not available');

  const fields: string[] = [];
  const values: unknown[] = [];

  if (data.name !== undefined) {
    fields.push('name = ?');
    values.push(data.name);
  }
  if (data.phone_number !== undefined) {
    fields.push('phone_number = ?');
    values.push(data.phone_number);
  }
  if (data.email !== undefined) {
    fields.push('email = ?');
    values.push(data.email || null);
  }
  if (data.vehicle_make !== undefined) {
    fields.push('vehicle_make = ?');
    values.push(data.vehicle_make);
  }
  if (data.vehicle_model !== undefined) {
    fields.push('vehicle_model = ?');
    values.push(data.vehicle_model);
  }
  if (data.registration_no !== undefined) {
    fields.push('registration_no = ?');
    values.push(data.registration_no || null);
  }
  if (data.service_type !== undefined) {
    fields.push('service_type = ?');
    values.push(data.service_type);
  }
  if (data.preferred_date !== undefined) {
    fields.push('preferred_date = ?');
    values.push(data.preferred_date);
  }
  if (data.preferred_time !== undefined) {
    fields.push('preferred_time = ?');
    values.push(data.preferred_time);
  }
  if (data.message !== undefined) {
    fields.push('message = ?');
    values.push(data.message || null);
  }

  if (fields.length === 0) return false;

  fields.push('updated_at = datetime("now")');
  values.push(id);

  const query = `UPDATE bookings SET ${fields.join(', ')} WHERE id = ?`;

  const result = await db.prepare(query).bind(...values).run();

  return result.success && result.meta.changes > 0;
}

export async function deleteBooking(db: D1Database, id: number): Promise<boolean> {
  if (!db) throw new Error('Database not available');

  const result = await db.prepare(`DELETE FROM bookings WHERE id = ?`).bind(id).run();

  return result.success && result.meta.changes > 0;
}

export async function getBookingStats(
  db: D1Database
): Promise<{
  total: number;
  pending: number;
  confirmed: number;
  completed: number;
  cancelled: number;
}> {
  if (!db) return { total: 0, pending: 0, confirmed: 0, completed: 0, cancelled: 0 };

  const result = await db
    .prepare(`
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN status = 'confirmed' THEN 1 ELSE 0 END) as confirmed,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
        SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled
      FROM bookings
    `)
    .first<{
      total: number;
      pending: number;
      confirmed: number;
      completed: number;
      cancelled: number;
    }>();

  return (
    result ?? {
      total: 0,
      pending: 0,
      confirmed: 0,
      completed: 0,
      cancelled: 0,
    }
  );
}
