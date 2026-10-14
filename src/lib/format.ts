/**
 * Format & parsing angka/tanggal.
 * Aplikasi ini memakai zona waktu WIB (UTC+7) supaya "hari ini"
 * selalu sama dengan hari menurut jam lokal pemilik toko.
 */
export const WIB = "Asia/Jakarta";

/** "Rp 12.500" */
export function rupiah(value: unknown): string {
  const num = Number(value ?? 0) || 0;
  return "Rp " + new Intl.NumberFormat("id-ID", {
    maximumFractionDigits: 0,
  }).format(num);
}

/** "12.500" (tanpa prefix Rp, untuk input) */
export function angka(value: unknown): string {
  const num = Number(value ?? 0) || 0;
  return new Intl.NumberFormat("id-ID", { maximumFractionDigits: 0 }).format(
    num,
  );
}

/** "14 Okt 2026, 09:30" */
export function tanggalWaktu(value: string | Date): string {
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("id-ID", {
    timeZone: WIB,
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

/** "14 Okt 2026" */
export function tanggal(value: string | Date): string {
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("id-ID", {
    timeZone: WIB,
    dateStyle: "medium",
  }).format(date);
}

/** Tanggal hari ini menurut WIB, format "YYYY-MM-DD". */
export function hariIniWIB(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: WIB,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

/** Tanggal (YYYY-MM-DD) N hari dari hari ini, relatif terhadap WIB. */
export function tambahHari(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const base = new Date(Date.UTC(y, m - 1, d));
  base.setUTCDate(base.getUTCDate() + days);
  return base.toISOString().slice(0, 10);
}

/**
 * Rentang UTC (Date) untuk satu hari penuh WIB.
 * Dipakai agar query "hari ini / bulan ini" tidak bergeser 7 jam.
 */
export function rentangHariWIB(dateStr: string): { start: Date; end: Date } {
  const [y, m, d] = dateStr.split("-").map(Number);
  const start = new Date(Date.UTC(y, m - 1, d, 0, 0, 0));
  start.setUTCMinutes(start.getUTCMinutes() - 7 * 60);
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
  return { start, end };
}

/** Awal bulan ini (WIB) dalam format YYYY-MM-DD. */
export function awalBulanWIB(): string {
  const today = hariIniWIB();
  return `${today.slice(0, 7)}-01`;
}

/** Awal tahun ini (WIB) dalam format YYYY-MM-DD. */
export function awalTahunWIB(): string {
  return `${hariIniWIB().slice(0, 4)}-01-01`;
}

/** Nilai untuk input <input type="datetime-local"> (WIB). */
export function untukInputTanggalWaktu(date: Date): string {
  const parts = new Intl.DateTimeFormat("sv-SE", {
    timeZone: WIB,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
  return parts.replace(" ", "T");
}

/** Ubah "2026-10-14T09:30" dari form (dianggap WIB) menjadi Date UTC. */
export function dariInputTanggalWaktu(value: string): Date {
  const match = /^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})/.exec(value);
  if (!match) {
    const fallback = new Date(value);
    if (!Number.isNaN(fallback.getTime())) return fallback;
    return new Date();
  }
  const [, y, mo, d, h, mi] = match;
  return new Date(
    Date.UTC(+y, +mo - 1, +d, +h - 7, +mi),
  );
}

/** Ambil teks angka dari input user: "45.000" atau "45000" -> 45000 */
export function parseAngka(value: unknown): number {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  if (typeof value !== "string") return 0;
  const cleaned = value.replace(/[^\d.-]/g, "");
  const parsed = Number.parseFloat(cleaned);
  return Number.isFinite(parsed) ? Math.abs(parsed) : 0;
}

/** Pembulatan ke 2 desimal, untuk hindari galat floating point. */
export function bulat2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}