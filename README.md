# Kasir Pakaian — Aplikasi Pencatatan Bisnis

Aplikasi untuk mencatat stok, harga beli, harga jual (per ukuran), dan penjualan
pakaian jualan di pasar. Dibuat dengan **Next.js + Tailwind CSS + Neon Postgres**,
dan gratis di-hosting di **Vercel**.

---

## Fitur

| Menu | Fungsi |
| --- | --- |
| **Dashboard** | Omzet & laba hari ini, grafik 7 hari, daftar stok menipis, transaksi terakhir |
| **Kasir** | Pilih barang per ukuran, atur jumlah, ubah harga sesuai harga pasar, diskon, kembalian, cetak kode transaksi. Stok berkurang otomatis |
| **Stok & Harga** | Harga beli, harga jual, dan stok **per ukuran** (S/M/L/XL atau 30/32/34/...). Cocok untuk pakaian sekolah |
| **Penjualan** | Riwayat transaksi dengan filter tanggal, detail isi transaksi, hapus transaksi (stok otomatis kembali) |
| **Laporan** | Omzet, laba, margin, barang terlaris, penjualan harian, metode pembayaran |

## Fitur Login

- Wajib login sebelum masuk aplikasi.
- Sesi tersimpan di database dengan cookie `httpOnly` selama **30 hari**, jadi tidak
  perlu login sering.
- Sesi diperpanjang otomatis kalau sudah lewat 15 hari.

---

## Cara Menjalankan di Komputer Sendiri

### 1. Siapkan database Neon (gratis)

1. Daftar di [console.neon.tech](https://console.neon.tech).
2. Buat project baru (pilih region terdekat, mis. **Singapore** atau **US East**).
3. Menu **Connect** → pilih **TypeScript** → salin **Connection string**.
   Pastikan diawali `postgresql://` dan berakhiran
   `?sslmode=require&channel_binding=require`.

### 2. Isi konfigurasi lokal

```bash
cp .env.example .env.local   # Windows: copy .env.example .env.local
```

Isi `DATABASE_URL` dengan connection string tadi, lalu opsional ubah
`ADMIN_USERNAME` / `ADMIN_PASSWORD` (default: `admin` / `admin123`).

### 3. Install, buat tabel, jalankan

```bash
npm install
npm run db:setup     # membuat tabel + user admin
npm run dev          # buka http://localhost:3000
```

---

## Deploy ke Vercel (gratis)

### 1. Upload kode ke GitHub

```bash
git init
git add .
git commit -m "Aplikasi kasir pakaian"
git branch -M main
git remote add origin https://github.com/akun-anda/toko-pakaian.git
git push -u origin main
```

### 2. Import ke Vercel

1. Login ke [vercel.com](https://vercel.com) → **Add New → Project** → pilih repo.
2. Framework otomatis terdeteksi sebagai Next.js, biarkan saja.
3. Buka **Environment Variables**, tambahkan:
   - `DATABASE_URL` = connection string Neon (sama seperti di lokal)
4. Klik **Deploy**.

### 3. Buat tabel di database Vercel

Buka tab **Settings → Environments** di proyek Vercel, lalu jalankan perintah berikut
di komputer (atau langsung salin `db/schema.sql` ke **SQL Editor** Neon):

```bash
npx vercel env pull .env.local
npm run db:setup
```

> Free tier Neon cukup untuk aplikasi ini: 0,5 GB storage dan 191,9 jam compute/bulan.

---

## Struktur Folder

```
app/
  login/            halaman login + server action login
  (app)/            semua halaman setelah login (dibungkus sidebar)
    dashboard/      ringkasan harian
    kasir/          input penjualan
    produk/         stok & harga per ukuran
    penjualan/      riwayat transaksi
    laporan/        laporan laba rugi
components/        komponen UI (sidebar, modal, input rupiah, ikon)
lib/
  auth.ts          login, session, cookie
  db.ts            koneksi Neon + helper
  queries.ts       semua query pembacaan data
  format.ts        format rupiah & tanggal (WIB)
db/schema.sql      struktur tabel
scripts/init-db.mjs  membuat tabel + user admin
```

---

## Catatan Teknis

- Semua tanggal & jam memakai zona waktu **WIB (Asia/Jakarta)** supaya "hari ini"
  tidak bergeser.
- Harga bisa diubah saat transaksi karena harga pasar berubah-ubah, tapi harga
  **modal** ikut tersimpan sebagai riwayat (untuk hitung laba yang benar).
- Pengurangan stok dan penyimpanan transaksi dijalankan dalam **satu pernyataan SQL**,
  jadi tidak mungkin stok minus atau transaksi tercatat setengah jalan.
- Session di database bisa dicabut kapan saja (mis. ganti password dari laptop lain).

## Menambah User Baru

```bash
node scripts/add-user.mjs kasir password123 "Nama Kasir"
```

User lama dengan username yang sama akan diperbarui (password diganti).