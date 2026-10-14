import { neon } from "@neondatabase/serverless";

type SqlFn = ReturnType<typeof neon>;

let client: SqlFn | null = null;

/**
 * Koneksi database Neon (serverless Postgres).
 * Aman dipanggil dari mana saja: koneksi dipakai ulang di satu instance.
 */
export function db(): SqlFn {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "DATABASE_URL belum diatur. Salin .env.example menjadi .env.local lalu isi connection string Neon.",
    );
  }
  if (!client) client = neon(url);
  return client;
}

/** Ubah nilai numeric (dikembalikan Neon sebagai string) menjadi number. */
export function n(value: unknown): number {
  if (value === null || value === undefined) return 0;
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

/**
 * Daftar placeholder SQL: placeholders(3) -> "$1, $2, $3".
 * Dipakai agar kita tidak perlu mengirim parameter bertipe array
 * (driver HTTP Neon hanya aman untuk nilai skalar & jsonb).
 */
export function placeholders(count: number, mulaiDari = 1): string {
  return Array.from(
    { length: count },
    (_, i) => `$${mulaiDari + i}`,
  ).join(", ");
}

/** Satu baris hasil query. Nilai numerik masuk sebagai string, pakai n() untuk mengubahnya. */
export type Baris = Record<string, unknown>;

/**
 * Jalankan query biasa dan selalu dapat array baris.
 * (Tipe bawaan driver neon bergantung mode, jadi dibungkus di sini.)
 */
export async function q(
  sqlText: string,
  params: unknown[] = [],
): Promise<Baris[]> {
  const hasil = await db().query(sqlText, params);
  return hasil as unknown as Baris[];
}