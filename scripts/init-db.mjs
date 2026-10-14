/**
 * Setup database: membuat tabel + user admin pertama.
 *
 * Cara pakai:
 *   1. Salin .env.example menjadi .env.local
 *   2. Isi DATABASE_URL dari Neon Dashboard
 *   3. Jalankan: npm run db:setup
 *
 * Aman dijalankan berkali-kali (idempotent).
 */
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import bcrypt from "bcryptjs";
import { neon } from "@neondatabase/serverless";

const rootDir = join(dirname(fileURLToPath(import.meta.url)), "..");

/** Baca .env.local / .env secara manual supaya tidak perlu dotenv. */
function loadEnv() {
  for (const file of [".env.local", ".env"]) {
    const path = join(rootDir, file);
    if (!existsSync(path)) continue;
    for (const rawLine of readFileSync(path, "utf8").split(/\r?\n/)) {
      const line = rawLine.trim();
      if (!line || line.startsWith("#")) continue;
      const eq = line.indexOf("=");
      if (eq === -1) continue;
      const key = line.slice(0, eq).trim();
      let value = line.slice(eq + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      if (!process.env[key]) process.env[key] = value;
    }
  }
}

function splitStatements(sqlText) {
  return sqlText
    .split(/\r?\n/)
    .filter((line) => !line.trim().startsWith("--"))
    .join("\n")
    .split(";")
    .map((s) => s.trim())
    .filter(Boolean);
}

async function main() {
  loadEnv();

  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error(
      "\n[ERROR] DATABASE_URL belum diisi.\n" +
        "  - Salin .env.example menjadi .env.local\n" +
        "  - Ambil connection string dari Neon Dashboard > Connect\n",
    );
    process.exit(1);
  }
  if (!/sslmode=require/.test(url)) {
    console.warn(
      "\n[Peringatan] DATABASE_URL sebaiknya berakhiran ?sslmode=require&channel_binding=require (driver neon_http).\n",
    );
  }

  const sql = neon(url);
  /** Neon >= 1.0 mengembalikan array baris langsung. */
  const rowsOf = (result) => (Array.isArray(result) ? result : result.rows ?? []);

  console.log("> Membuat tabel...");
  for (const statement of splitStatements(
    readFileSync(join(rootDir, "db", "schema.sql"), "utf8"),
  )) {
    await sql.query(statement);
  }
  console.log("  Tabel siap.");

  const username = (process.env.ADMIN_USERNAME || "admin").toLowerCase();
  const password = process.env.ADMIN_PASSWORD || "admin123";
  const name = process.env.ADMIN_NAME || "Pemilik Toko";

  const existing = rowsOf(
    await sql.query("select id from users where username = $1", [username]),
  );

  if (existing.length > 0) {
    console.log(`\nUser "${username}" sudah ada, admin tidak diubah.`);
  } else {
    const hash = await bcrypt.hash(password, 10);
    await sql.query(
      "insert into users (username, name, password_hash) values ($1, $2, $3)",
      [username, name, hash],
    );
    console.log(`\nUser admin dibuat:`);
    console.log(`  username : ${username}`);
    console.log(`  password : ${password}`);
    console.log("  (ganti password setelah login pertama)");
  }

  console.log("\nSelesai. Jalankan `npm run dev` untuk mulai memakai aplikasi.\n");
}

main().catch((error) => {
  console.error("\n[ERROR] Setup gagal:", error.message);
  process.exit(1);
});