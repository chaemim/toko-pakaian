import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { randomBytes } from "node:crypto";
import { compare, hash } from "bcryptjs";
import { n, q } from "./db";
import type { User } from "./types";

const NAMA_COOKIE = "toko_session";
const DURASI_HARI = 30; // session bertahan 30 hari
const PERPANJANG_MIN_HARI = 15; // diperpanjang otomatis bila sisa < 15 hari

export type HasilLogin =
  | { ok: true; user: User }
  | { ok: false; message: string };

export function hashPassword(password: string): Promise<string> {
  return hash(password, 10);
}

/** Cek username + password. Pesan error dibuat sama agar tidak membocorkan data. */
export async function cekLogin(
  username: string,
  password: string,
): Promise<HasilLogin> {
  const user = String(username ?? "").trim().toLowerCase();
  if (!user || !password) {
    return { ok: false, message: "Username dan password wajib diisi." };
  }

  const rows = await q(
    "select id, username, name, password_hash from users where username = $1 limit 1",
    [user],
  );
  const data = rows[0];

  if (!data) {
    return { ok: false, message: "Username atau password salah." };
  }

  const cocok = await compare(password, String(data.password_hash));
  if (!cocok) {
    return { ok: false, message: "Username atau password salah." };
  }

  return {
    ok: true,
    user: {
      id: String(data.id),
      username: String(data.username),
      name: String(data.name),
    },
  };
}

function opsiCookie(maxAge: number) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge,
  };
}

/** Buat sesi baru + pasang cookie. Dipanggil setelah login berhasil. */
export async function buatSesi(userId: string): Promise<void> {
  const token = randomBytes(32).toString("hex");
  const kedaluwarsa = new Date(Date.now() + DURASI_HARI * 24 * 60 * 60 * 1000);

  await q(
    "insert into sessions (token, user_id, expires_at) values ($1, $2, $3)",
    [token, userId, kedaluwarsa],
  );

  const store = await cookies();
  store.set(NAMA_COOKIE, token, opsiCookie(DURASI_HARI * 24 * 60 * 60));
}

/** Ambil user dari session cookie. Otomatis memperpanjang session yang mendekati habis. */
export async function ambilPengguna(): Promise<User | null> {
  const store = await cookies();
  const token = store.get(NAMA_COOKIE)?.value;
  if (!token) return null;

  let row: {
    id: string;
    username: string;
    name: string;
    expires_at: string;
  };
  try {
    const rows = await q(
      `select u.id, u.username, u.name, s.expires_at
         from sessions s
         join users u on u.id = s.user_id
        where s.token = $1`,
      [token],
    );
    if (rows.length === 0) return null;
    row = rows[0] as typeof row;
  } catch {
    // Database belum siap / tidak bisa dijangkau -> anggap belum login
    return null;
  }

  const expires = new Date(row.expires_at).getTime();
  const sekarang = Date.now();

  if (expires <= sekarang) {
    try {
      await q("delete from sessions where token = $1", [token]);
      store.delete(NAMA_COOKIE);
    } catch {
      // cookie tidak bisa diubah di Server Component
    }
    return null;
  }

  // Perpanjang session supaya user jarang logout (hanya bisa dilakukan di Server Action/Route Handler)
  const sisaHari = (expires - sekarang) / (24 * 60 * 60 * 1000);
  if (sisaHari < PERPANJANG_MIN_HARI) {
    const baru = new Date(sekarang + DURASI_HARI * 24 * 60 * 60 * 1000);
    try {
      await q("update sessions set expires_at = $2 where token = $1", [
        token,
        baru,
      ]);
      store.set(NAMA_COOKIE, token, opsiCookie(DURASI_HARI * 24 * 60));
    } catch {
      // Di dalam Server Component cookie tidak bisa diubah; abaikan saja.
    }
  }

  return { id: row.id, username: row.username, name: row.name };
}

/** Wajib login: dipakai di halaman & server action yang terlindungi. */
export async function wajibLogin(): Promise<User> {
  const user = await ambilPengguna();
  if (!user) redirect("/login");
  return user;
}

export async function hapusSesi(): Promise<void> {
  const store = await cookies();
  const token = store.get(NAMA_COOKIE)?.value;
  if (token) {
    try {
      await q("delete from sessions where token = $1", [token]);
    } catch {
      // abaikan error saat logout
    }
  }
  store.delete(NAMA_COOKIE);
}

/** Jumlah user (untuk tombol "Daftar user" di halaman login). */
export async function jumlahUser(): Promise<number> {
  const rows = await q("select count(*)::int as total from users");
  return n(rows[0]?.total);
}
