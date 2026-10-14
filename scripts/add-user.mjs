/**
 * Tambah user baru (mis. kasir kedua).
 *
 * Cara pakai:
 *   node scripts/add-user.mjs kasir password123 "Nama Kasir"
 *   node scripts/add-user.mjs kasir password123        (nama otomatis = username)
 */
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { neon } from "@neondatabase/serverless";
import bcrypt from "bcryptjs";

const rootDir = join(dirname(fileURLToPath(import.meta.url)), "..");

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

const [username, password, name] = process.argv.slice(2);

if (!username || !password) {
  console.error(
    "\nCara pakai: node scripts/add-user.mjs <username> <password> [nama]\n",
  );
  process.exit(1);
}

loadEnv();
const url = process.env.DATABASE_URL;
if (!url) {
  console.error("\n[ERROR] DATABASE_URL belum diisi di .env.local\n");
  process.exit(1);
}

const sql = neon(url);
const hash = await bcrypt.hash(password, 10);

const rows = await sql.query(
  `insert into users (username, name, password_hash)
   values ($1, $2, $3)
   on conflict (username) do update
     set name = excluded.name, password_hash = excluded.password_hash
   returning id`,
  [username.toLowerCase(), name || username, hash],
);
const created = rows.length > 0;

console.log(
  `\n${created ? "User disimpan" : "Gagal"}: ${username.toLowerCase()}` +
    (created ? "" : ""),
);
console.log(`  nama     : ${name || username}`);
console.log(`  password : ${password}\n`);