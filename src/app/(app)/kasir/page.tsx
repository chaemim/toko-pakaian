import { wajibLogin } from "@/lib/auth";
import { opsiProdukKasir } from "@/lib/queries";
import { untukInputTanggalWaktu } from "@/lib/format";
import { Judul } from "@/components/ui";
import KasirClient from "./KasirClient";

export const metadata = { title: "Kasir - Kasir Pakaian" };

export default async function HalamanKasir() {
  await wajibLogin();
  const produk = await opsiProdukKasir("");

  return (
    <>
      <Judul
        judul="Kasir"
        deskripsi="Pilih barang, atur jumlah, lalu simpan penjualan. Stok berkurang otomatis."
      />
      <KasirClient produkAwal={produk} waktuAwal={untukInputTanggalWaktu(new Date())} />
    </>
  );
}