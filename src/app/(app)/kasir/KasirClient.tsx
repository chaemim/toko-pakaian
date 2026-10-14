"use client";

import { useActionState, useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { cariProduk, simpanPenjualan, type HasilKasir } from "./actions";
import type { OpsiProduk } from "@/lib/queries";
import { rupiah, untukInputTanggalWaktu } from "@/lib/format";
import { Kartu, Kosong } from "@/components/ui";
import {
  IkonCari,
  IkonCek,
  IkonKeranjang,
  IkonTambah,
  IkonTutup,
} from "@/components/icons";

type ItemKeranjang = {
  sizeId: string;
  nama: string;
  size: string;
  qty: number;
  harga: number;
  modal: number;
  stok: number;
};

const METODE = ["Tunai", "Transfer", "QRIS", "Tempo"];
const AWAL: HasilKasir = { ok: false, message: "" };

export default function KasirClient({
  produkAwal,
  waktuAwal,
}: {
  produkAwal: OpsiProduk[];
  waktuAwal: string;
}) {
  const router = useRouter();
  const [cari, setCari] = useState("");
  const [hasilCari, setHasilCari] = useState<OpsiProduk[]>([]);
  const [keranjang, setKeranjang] = useState<ItemKeranjang[]>([]);
  const [diskon, setDiskon] = useState("");
  const [received, setReceived] = useState("");
  const [pembayaran, setPembayaran] = useState("Tunai");
  const [struk, setStruk] = useState<HasilKasir | null>(null);
  const [tanggalJual, setTanggalJual] = useState(waktuAwal);
  const [pelanggan, setPelanggan] = useState("");
  const [catatan, setCatatan] = useState("");
  const [menang, mulaiCari] = useTransition();

  // Tanpa pencarian, tampilkan data terbaru dari server (selalu ikut ter-refresh)
  const daftar = cari.trim() === "" ? produkAwal : hasilCari;

  /* Pencarian produk dari server (hanya saat mengetik) */
  useEffect(() => {
    if (cari.trim() === "") return;
    const t = setTimeout(() => {
      mulaiCari(async () => {
        setHasilCari(await cariProduk(cari));
      });
    }, 300);
    return () => clearTimeout(t);
  }, [cari]);

  // useActionState dipakai agar form tetap bisa dikirim berulang kali
  // setelah gagal, tanpa kehilangan isian yang sudah diketik.
  const [status, formAction, pending] = useActionState(simpanPenjualan, AWAL);

  // Hasil server action baru tersedia setelah submit selesai, jadi efek ini
  // dipakai untuk menampilkan struk & mengosongkan keranjang (pola resmi React).
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (!status.ok) return;
    setStruk(status);
    setKeranjang([]);
    setDiskon("");
    setReceived("");
    setPelanggan("");
    setCatatan("");
    setTanggalJual(untukInputTanggalWaktu(new Date()));
    router.refresh();
    if (cari.trim() !== "") {
      mulaiCari(async () => {
        setHasilCari(await cariProduk(cari));
      });
    }
  }, [status, router, cari]);
  /* eslint-enable react-hooks/set-state-in-effect */

  /* Keranjang */
  function tambah(p: OpsiProduk, s: OpsiProduk["sizes"][number]) {
    if (s.stock <= 0) return;
    setKeranjang((lama) => {
      const ada = lama.find((i) => i.sizeId === s.id);
      if (ada) {
        if (ada.qty >= s.stock) return lama;
        return lama.map((i) =>
          i.sizeId === s.id ? { ...i, qty: i.qty + 1 } : i,
        );
      }
      return [
        ...lama,
        {
          sizeId: s.id,
          nama: p.name,
          size: s.size,
          qty: 1,
          harga: s.sell_price,
          modal: s.buy_price,
          stok: s.stock,
        },
      ];
    });
  }

  function ubahQty(sizeId: string, qty: number) {
    setKeranjang((lama) =>
      lama
        .map((i) =>
          i.sizeId === sizeId
            ? { ...i, qty: Math.max(0, Math.min(qty, i.stok)) }
            : i,
        )
        .filter((i) => i.qty > 0),
    );
  }

  function ubahHarga(sizeId: string, harga: number) {
    setKeranjang((lama) =>
      lama.map((i) => (i.sizeId === sizeId ? { ...i, harga } : i)),
    );
  }

  const hitung = useMemo(() => {
    const subtotal = keranjang.reduce((a, i) => a + i.harga * i.qty, 0);
    const modal = keranjang.reduce((a, i) => a + i.modal * i.qty, 0);
    const potong = Math.min(
      Number(diskon.replace(/\D/g, "")) || 0,
      subtotal,
    );
    const total = subtotal - potong;
    return {
      subtotal,
      modal,
      potong,
      total,
      laba: total - modal,
      kembali:
        pembayaran === "Tunai"
          ? Math.max(0, (Number(received.replace(/\D/g, "")) || 0) - total)
          : 0,
    };
  }, [keranjang, diskon, received, pembayaran]);

  /* Layar struk setelah berhasil disimpan */
  if (struk?.ok) {
    return (
      <Kartu className="mx-auto max-w-md p-6 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
          <IkonCek className="h-9 w-9" />
        </div>
        <h2 className="text-lg font-bold text-slate-900">Penjualan Tersimpan</h2>
        <p className="mt-1 text-sm text-slate-500">
          Kode transaksi <b className="text-slate-700">{struk.code}</b>
        </p>

        <div className="mt-5 space-y-2 rounded-xl bg-slate-50 p-4 text-left text-sm">
          <div className="flex justify-between">
            <span className="text-slate-500">Total</span>
            <b className="tabular text-slate-900">{rupiah(struk.total ?? 0)}</b>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Kembalian</span>
            <b className="tabular text-emerald-700">
              {rupiah(struk.kembalian ?? 0)}
            </b>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Laba</span>
            <b className="tabular text-emerald-700">{rupiah(struk.laba ?? 0)}</b>
          </div>
        </div>

        <p className="mt-4 text-xs text-slate-400">
          {struk.message}
        </p>

        <button
          type="button"
          onClick={() => {
            setStruk(null);
            setReceived("");
          }}
          className="mt-5 w-full rounded-lg bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700"
        >
          Transaksi Berikutnya
        </button>
      </Kartu>
    );
  }

  return (
    <div className="grid gap-4 lg:grid-cols-5">
      {/* Pilih produk */}
      <div className="lg:col-span-2">
        <div className="relative mb-3">
          <IkonCari className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={cari}
            onChange={(e) => setCari(e.target.value)}
            placeholder="Cari nama pakaian..."
            className="w-full rounded-lg border border-slate-300 bg-white py-2.5 pr-3 pl-9 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
          />
        </div>

        <div className={`space-y-2 ${menang ? "opacity-60" : ""}`}>
          {daftar.length === 0 ? (
            <Kartu>
              <Kosong
                pesan={
                  cari
                    ? "Produk tidak ditemukan. Cek penulisan atau tambahkan produk baru."
                    : "Belum ada produk. Tambahkan di menu Stok & Harga dulu."
                }
                Ikon={IkonKeranjang}
              />
            </Kartu>
          ) : (
            daftar.map((p) => (
              <Kartu key={p.id} className="p-3">
                <div className="mb-2 flex items-center gap-2">
                  <p className="truncate text-sm font-semibold text-slate-900">
                    {p.name}
                  </p>
                  {p.category && (
                    <span className="shrink-0 rounded bg-blue-50 px-1.5 py-0.5 text-[10px] font-semibold text-blue-700">
                      {p.category}
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {p.sizes.map((s) => {
                    const habis = s.stock <= 0;
                    return (
                      <button
                        key={s.id}
                        type="button"
                        disabled={habis}
                        onClick={() => tambah(p, s)}
                        className={`rounded-lg border px-2.5 py-1.5 text-left text-xs transition ${
                          habis
                            ? "cursor-not-allowed border-slate-200 bg-slate-50 text-slate-300"
                            : "border-slate-200 bg-white hover:border-emerald-500 hover:bg-emerald-50"
                        }`}
                      >
                        <span className="block font-bold">{s.size}</span>
                        <span className="tabular block">
                          {rupiah(s.sell_price)}
                        </span>
                        <span
                          className={`block text-[10px] ${
                            s.stock <= 3 ? "text-rose-500" : "text-slate-400"
                          }`}
                        >
                          {habis ? "habis" : `sisa ${s.stock}`}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </Kartu>
            ))
          )}
        </div>
      </div>

      {/* Keranjang */}
      <div className="lg:col-span-3">
        <form action={formAction}>
          <input
            type="hidden"
            name="items"
            value={JSON.stringify(
              keranjang.map((i) => ({
                sizeId: i.sizeId,
                qty: i.qty,
                sellPrice: i.harga,
              })),
            )}
          />

          <Kartu className="overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
              <h2 className="flex items-center gap-2 text-sm font-bold text-slate-900">
                <IkonKeranjang className="h-4 w-4" />
                Keranjang ({keranjang.length})
              </h2>
              {keranjang.length > 0 && (
                <button
                  type="button"
                  onClick={() => setKeranjang([])}
                  className="text-xs font-medium text-slate-500 hover:text-rose-600"
                >
                  Kosongkan
                </button>
              )}
            </div>

            {keranjang.length === 0 ? (
              <Kosong
                pesan="Ketuk ukuran di sebelah kiri untuk menambah barang."
                Ikon={IkonTambah}
              />
            ) : (
              <ul className="divide-y divide-slate-100">
                {keranjang.map((i) => (
                  <li key={i.sizeId} className="flex items-center gap-2 px-3 py-2.5">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-slate-800">
                        {i.nama}{" "}
                        <span className="text-slate-400">({i.size})</span>
                      </p>
                      <p className="text-[11px] text-slate-400">
                        Modal {rupiah(i.modal)} · sisa {i.stok}
                      </p>
                    </div>

                    <div className="flex items-center rounded-lg border border-slate-300">
                      <button
                        type="button"
                        onClick={() => ubahQty(i.sizeId, i.qty - 1)}
                        className="px-2.5 py-1.5 text-slate-500 hover:text-rose-600"
                      >
                        −
                      </button>
                      <input
                        type="number"
                        value={i.qty}
                        min={0}
                        max={i.stok}
                        onChange={(e) => ubahQty(i.sizeId, Number(e.target.value))}
                        className="tabular w-10 border-0 bg-transparent py-1.5 text-center text-sm font-bold outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => ubahQty(i.sizeId, i.qty + 1)}
                        className="px-2.5 py-1.5 text-slate-500 hover:text-emerald-600"
                      >
                        +
                      </button>
                    </div>

                    <div className="w-28 shrink-0">
                      <input
                        value={new Intl.NumberFormat("id-ID").format(i.harga)}
                        onChange={(e) =>
                          ubahHarga(
                            i.sizeId,
                            Number(e.target.value.replace(/\D/g, "")) || 0,
                          )
                        }
                        className="tabular w-full rounded-lg border border-slate-300 px-2 py-1.5 text-right text-sm font-semibold outline-none focus:border-emerald-500"
                        title="Harga jual (bisa diubah)"
                      />
                    </div>

                    <p className="tabular w-24 shrink-0 text-right text-sm font-bold text-slate-900">
                      {rupiah(i.harga * i.qty)}
                    </p>

                    <button
                      type="button"
                      onClick={() =>
                        setKeranjang((lama) =>
                          lama.filter((x) => x.sizeId !== i.sizeId),
                        )
                      }
                      className="shrink-0 rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                    >
                      <IkonTutup className="h-4 w-4" />
                    </button>
                  </li>
                ))}
              </ul>
            )}

            {/* Ringkasan & pembayaran */}
            <div className="space-y-3 border-t border-slate-100 bg-slate-50/60 p-4">
              <div className="grid gap-2 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-500">
                    Diskon (Rp)
                  </label>
                  <input
                    name="discount"
                    value={diskon}
                    onChange={(e) => setDiskon(e.target.value.replace(/\D/g, ""))}
                    placeholder="0"
                    className="tabular w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-right text-sm outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-500">
                    Pembayaran
                  </label>
                  <select
                    name="payment"
                    value={pembayaran}
                    onChange={(e) => setPembayaran(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-500"
                  >
                    {METODE.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid gap-2 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-500">
                    Waktu penjualan
                  </label>
                  <input
                    type="datetime-local"
                    name="soldAt"
                    value={tanggalJual}
                    onChange={(e) => setTanggalJual(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-500">
                    Uang diterima
                  </label>
                  <input
                    name="received"
                    value={received}
                    onChange={(e) => setReceived(e.target.value.replace(/\D/g, ""))}
                    placeholder="0"
                    disabled={pembayaran !== "Tunai"}
                    className="tabular w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-right text-sm outline-none focus:border-emerald-500 disabled:bg-slate-100 disabled:text-slate-400"
                  />
                </div>
              </div>

              <div className="grid gap-2 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-500">
                    Nama pelanggan (opsional)
                  </label>
                  <input
                    name="customer"
                    value={pelanggan}
                    onChange={(e) => setPelanggan(e.target.value)}
                    placeholder="Mis. Bu Tini"
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-500">
                    Catatan (opsional)
                  </label>
                  <input
                    name="note"
                    value={catatan}
                    onChange={(e) => setCatatan(e.target.value)}
                    placeholder="Mis. tukar ukuran"
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="space-y-1 border-t border-slate-200 pt-3 text-sm">
                <div className="flex justify-between text-slate-500">
                  <span>Subtotal</span>
                  <span className="tabular">{rupiah(hitung.subtotal)}</span>
                </div>
                {hitung.potong > 0 && (
                  <div className="flex justify-between text-slate-500">
                    <span>Diskon</span>
                    <span className="tabular text-rose-600">
                      − {rupiah(hitung.potong)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between text-base font-bold text-slate-900">
                  <span>Total</span>
                  <span className="tabular">{rupiah(hitung.total)}</span>
                </div>
                <div className="flex justify-between text-xs text-slate-500">
                  <span>Perkiraan laba</span>
                  <span className="tabular">{rupiah(hitung.laba)}</span>
                </div>
                {pembayaran === "Tunai" && (
                  <div className="flex justify-between font-semibold text-emerald-700">
                    <span>Kembalian</span>
                    <span className="tabular">{rupiah(hitung.kembali)}</span>
                  </div>
                )}
              </div>

              {status.message && !status.ok && (
                <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">
                  {status.message}
                </p>
              )}

              <button
                type="submit"
                disabled={pending || keranjang.length === 0}
                className="w-full rounded-lg bg-emerald-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {pending
                  ? "Menyimpan..."
                  : `Simpan Penjualan · ${rupiah(hitung.total)}`}
              </button>
              <p className="text-center text-[11px] text-slate-400">
                Harga jual bisa diubah saat transaksi karena harga pasar berubah-ubah.
              </p>
            </div>
          </Kartu>
        </form>
      </div>
    </div>
  );
}