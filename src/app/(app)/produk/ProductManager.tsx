"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { hapusProduk, simpanProduk, type HasilAksi } from "./actions";
import type { Product } from "@/lib/types";
import { parseAngka, rupiah } from "@/lib/format";
import { Kartu, Kosong, Lencana } from "@/components/ui";
import {
  IkonCek,
  IkonHapus,
  IkonKemeja,
  IkonTambah,
  IkonTutup,
  IkonUbah,
} from "@/components/icons";
import InputRupiah from "@/components/InputRupiah";

type Baris = { size: string; buy: string; sell: string; stock: string };

const UKURAN_SIAP = [
  "S", "M", "L", "XL", "2XL", "3XL", "4XL",
  "30", "32", "34", "36", "38", "40", "42",
];

const KOSONG: Baris = { size: "", buy: "", sell: "", stock: "0" };
const AWAL: HasilAksi = { ok: false, message: "" };

function Toast({ pesan, onTutup }: { pesan: string; onTutup: () => void }) {
  useEffect(() => {
    const t = setTimeout(onTutup, 4000);
    return () => clearTimeout(t);
  }, [pesan, onTutup]);

  return (
    <div className="fixed inset-x-4 bottom-4 z-50 flex justify-center sm:justify-end">
      <div className="flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-sm font-medium text-white shadow-xl">
        <IkonCek className="h-4 w-4 text-emerald-400" />
        {pesan}
      </div>
    </div>
  );
}

export default function ProductManager({
  products,
  kategori,
}: {
  products: Product[];
  kategori: string[];
}) {
  const router = useRouter();
  const [terbuka, setTerbuka] = useState(false);
  const [produk, setProduk] = useState<Product | null>(null);
  const [baris, setBaris] = useState<Baris[]>([{ ...KOSONG }]);
  // Field form memakai state (controlled) supaya isian tidak hilang
  // ketika server menolak penyimpanan dan form dikirim ulang.
  const [form, setForm] = useState({ name: "", category: "", note: "" });
  // naik setiap modal dibuka, supaya input di dalam form dibuat ulang
  const [sesi, setSesi] = useState(0);
  const [toast, setToast] = useState("");
  const [bukaDetail, setBukaDetail] = useState<string | null>(null);
  // useActionState (bukan form action inline) dipakai agar form tetap bisa
  // dikirim berulang kali setelah gagal, misalnya karena validasi.
  const [status, formAction, pending] = useActionState(simpanProduk, AWAL);

  // Hasil server action baru tersedia setelah submit selesai, jadi efek ini
  // dipakai untuk menutup modal & menampilkan notifikasi (pola resmi React).
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (status.ok) {
      setTerbuka(false);
      setToast(status.message);
      router.refresh();
    }
  }, [status, router]);
  /* eslint-enable react-hooks/set-state-in-effect */

  function bukaTambah() {
    setProduk(null);
    setForm({ name: "", category: "", note: "" });
    setBaris([{ ...KOSONG }]);
    setSesi((n) => n + 1);
    setTerbuka(true);
  }

  function bukaEdit(p: Product) {
    setProduk(p);
    setForm({ name: p.name, category: p.category, note: p.note });
    setSesi((n) => n + 1);
    setBaris(
      p.sizes.length > 0
        ? p.sizes.map((s) => ({
            size: s.size,
            buy: String(Math.trunc(s.buy_price)),
            sell: String(Math.trunc(s.sell_price)),
            stock: String(s.stock),
          }))
        : [{ ...KOSONG }],
    );
    setTerbuka(true);
  }

  function ubahBaris(i: number, isi: Partial<Baris>) {
    setBaris((lama) => lama.map((b, idx) => (idx === i ? { ...b, ...isi } : b)));
  }

  function tambahUkuran(ukuran?: string) {
    setBaris((lama) => {
      if (
        ukuran &&
        lama.some((b) => b.size.trim().toLowerCase() === ukuran.toLowerCase())
      ) {
        return lama;
      }
      return [...lama, { size: ukuran ?? "", buy: "", sell: "", stock: "0" }];
    });
  }

  async function konfirmasiHapus(p: Product) {
    if (!confirm(`Hapus produk "${p.name}"?\nUkuran dan stoknya ikut terhapus.`)) {
      return;
    }
    const fd = new FormData();
    fd.set("id", p.id);
    await hapusProduk(fd).then((hasil) => setToast(hasil.message));
    router.refresh();
  }

  const totalModal = baris.reduce(
    (a, b) => a + parseAngka(b.buy) * parseAngka(b.stock),
    0,
  );
  const totalNilaiJual = baris.reduce(
    (a, b) => a + parseAngka(b.sell) * parseAngka(b.stock),
    0,
  );

  return (
    <>
      {/* Toolbar */}
      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="text-sm text-slate-500">
          {products.length} produk
        </p>
        <button
          type="button"
          onClick={bukaTambah}
          className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700"
        >
          <IkonTambah className="h-4 w-4" />
          Tambah Produk
        </button>
      </div>

      {/* Daftar produk */}
      {products.length === 0 ? (
        <Kartu>
          <Kosong
            pesan="Belum ada produk. Klik Tambah Produk untuk mulai mencatat stok dan harga."
            Ikon={IkonKemeja}
          />
        </Kartu>
      ) : (
        <div className="space-y-2">
          {products.map((p) => {
            const totalStok = p.sizes.reduce((a, s) => a + s.stock, 0);
            const modal = p.sizes.reduce(
              (a, s) => a + s.buy_price * s.stock,
              0,
            );
            const hargaMin = p.sizes.length
              ? Math.min(...p.sizes.map((s) => s.sell_price))
              : 0;
            const hargaMax = p.sizes.length
              ? Math.max(...p.sizes.map((s) => s.sell_price))
              : 0;
            const buka = bukaDetail === p.id;

            return (
              <Kartu key={p.id} className="overflow-hidden">
                <div className="flex items-center gap-3 p-3.5">
                  <button
                    type="button"
                    onClick={() => setBukaDetail(buka ? null : p.id)}
                    className="flex min-w-0 flex-1 items-center gap-3 text-left"
                  >
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-lg">
                      👕
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate font-semibold text-slate-900">
                          {p.name}
                        </p>
                        {p.category && (
                          <Lencana warna="blue">{p.category}</Lencana>
                        )}
                        {!p.is_active && (
                          <Lencana warna="rose">Nonaktif</Lencana>
                        )}
                      </div>
                      <p className="mt-0.5 text-xs text-slate-500">
                        {p.sizes.length} ukuran · Modal {rupiah(modal)}
                      </p>
                    </div>
                    <div className="hidden shrink-0 text-right sm:block">
                      <p className="tabular text-sm font-bold text-slate-900">
                        {hargaMin === hargaMax
                          ? rupiah(hargaMin)
                          : `${rupiah(hargaMin)} - ${rupiah(hargaMax)}`}
                      </p>
                      <p className="text-xs text-slate-500">Harga jual</p>
                    </div>
                    <div className="w-20 shrink-0 text-right">
                      <p
                        className={`tabular text-sm font-bold ${
                          totalStok === 0 ? "text-rose-600" : "text-slate-900"
                        }`}
                      >
                        {totalStok}
                      </p>
                      <p className="text-xs text-slate-500">pcs</p>
                    </div>
                  </button>

                  <div className="flex shrink-0 items-center gap-1">
                    <button
                      type="button"
                      onClick={() => bukaEdit(p)}
                      className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-emerald-600"
                      title="Ubah produk"
                    >
                      <IkonUbah className="h-4.5 w-4.5" />
                    </button>
                    <button
                      type="button"
                      disabled={pending}
                      onClick={() => konfirmasiHapus(p)}
                      className="rounded-lg p-2 text-slate-500 transition hover:bg-rose-50 hover:text-rose-600 disabled:opacity-50"
                      title="Hapus produk"
                    >
                      <IkonHapus className="h-4.5 w-4.5" />
                    </button>
                  </div>
                </div>

                {buka && (
                  <div className="border-t border-slate-100 bg-slate-50/60 px-3.5 py-3">
                    {p.sizes.length === 0 ? (
                      <p className="py-2 text-center text-sm text-slate-400">
                        Belum ada data ukuran.
                      </p>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead className="text-xs text-slate-500">
                            <tr>
                              <th className="py-1.5 text-left font-medium">Ukuran</th>
                              <th className="py-1.5 text-right font-medium">Harga Beli</th>
                              <th className="py-1.5 text-right font-medium">Harga Jual</th>
                              <th className="py-1.5 text-right font-medium">Laba/pcs</th>
                              <th className="py-1.5 text-right font-medium">Stok</th>
                              <th className="py-1.5 text-right font-medium">Nilai Stok</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-200/70">
                            {p.sizes.map((s) => (
                              <tr key={s.id}>
                                <td className="py-2 font-semibold text-slate-800">
                                  {s.size}
                                </td>
                                <td className="tabular py-2 text-right text-slate-600">
                                  {rupiah(s.buy_price)}
                                </td>
                                <td className="tabular py-2 text-right font-medium text-slate-900">
                                  {rupiah(s.sell_price)}
                                </td>
                                <td className="tabular py-2 text-right font-medium text-emerald-600">
                                  {rupiah(s.sell_price - s.buy_price)}
                                </td>
                                <td
                                  className={`tabular py-2 text-right font-semibold ${
                                    s.stock === 0 ? "text-rose-600" : "text-slate-800"
                                  }`}
                                >
                                  {s.stock}
                                </td>
                                <td className="tabular py-2 text-right text-slate-500">
                                  {rupiah(s.buy_price * s.stock)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                    {p.note && (
                      <p className="mt-2 text-xs text-slate-500">Catatan: {p.note}</p>
                    )}
                  </div>
                )}
              </Kartu>
            );
          })}
        </div>
      )}

      {/* Modal form produk */}
      {terbuka && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
          <div
            className="absolute inset-0 bg-slate-900/50"
            onClick={() => setTerbuka(false)}
          />
          <div className="relative flex max-h-[92vh] w-full max-w-2xl flex-col rounded-t-2xl bg-white shadow-2xl sm:rounded-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3.5">
              <h2 className="font-bold text-slate-900">
                {produk ? "Ubah Produk" : "Tambah Produk"}
              </h2>
              <button
                type="button"
                onClick={() => setTerbuka(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"
                aria-label="Tutup"
              >
                <IkonTutup className="h-5 w-5" />
              </button>
            </div>

            <form action={formAction} className="scroll-thin flex-1 overflow-y-auto">
              <input type="hidden" name="id" value={produk?.id ?? ""} />
              <input
                type="hidden"
                name="sizes"
                value={JSON.stringify(
                  baris.map((b) => ({
                    size: b.size,
                    buy: parseAngka(b.buy),
                    sell: parseAngka(b.sell),
                    stock: parseAngka(b.stock),
                  })),
                )}
              />

              <div className="space-y-4 px-5 py-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-700">
                      Nama Produk *
                    </label>
                    <input
                      name="name"
                      value={form.name}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, name: e.target.value }))
                      }
                      required
                      autoFocus
                      placeholder="Contoh: Kemeja Sekolah SD"
                      className="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-700">
                      Kategori
                    </label>
                    <input
                      name="category"
                      value={form.category}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, category: e.target.value }))
                      }
                      list="daftar-kategori"
                      placeholder="Contoh: Sekolah"
                      className="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                    />
                    <datalist id="daftar-kategori">
                      {kategori.map((k) => (
                        <option key={k} value={k} />
                      ))}
                    </datalist>
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Catatan (opsional)
                  </label>
                  <input
                    name="note"
                    value={form.note}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, note: e.target.value }))
                    }
                    placeholder="Contoh: harga khusus ukuran besar"
                    className="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                  />
                </div>

                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <label className="text-sm font-medium text-slate-700">
                      Harga & Stok per Ukuran *
                    </label>
                    <span className="text-xs text-slate-400">
                      Isi harga beli, harga jual, dan stok tiap ukuran
                    </span>
                  </div>

                  {/* Header tabel */}
                  <div className="hidden grid-cols-12 gap-2 px-1 pb-1 text-xs font-medium text-slate-500 sm:grid">
                    <div className="col-span-3">Ukuran</div>
                    <div className="col-span-3 text-right">Harga Beli</div>
                    <div className="col-span-3 text-right">Harga Jual</div>
                    <div className="col-span-2 text-right">Stok</div>
                    <div className="col-span-1" />
                  </div>

                  <div className="space-y-2">
                    {baris.map((b, i) => {
                      const laba =
                        parseAngka(b.sell) - parseAngka(b.buy);
                      return (
                        <div
                          key={i}
                          className="grid grid-cols-2 gap-2 rounded-lg border border-slate-200 p-2 sm:grid-cols-12 sm:border-0 sm:p-0"
                        >
                          <div className="col-span-2 sm:col-span-3">
                            <input
                              value={b.size}
                              onChange={(e) =>
                                ubahBaris(i, { size: e.target.value })
                              }
                              placeholder="M"
                              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold uppercase outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                            />
                          </div>
                          <div className="sm:col-span-3">
                            <InputRupiah
                              key={`${sesi}-buy-${i}`}
                              name={`buy-${i}`}
                              defaultValue={b.buy}
                              onValue={(v) => ubahBaris(i, { buy: String(v) })}
                              className="sm:border-0 sm:bg-slate-50"
                            />
                          </div>
                          <div className="sm:col-span-3">
                            <InputRupiah
                              key={`${sesi}-sell-${i}`}
                              name={`sell-${i}`}
                              defaultValue={b.sell}
                              onValue={(v) => ubahBaris(i, { sell: String(v) })}
                              className="sm:border-0 sm:bg-slate-50"
                            />
                          </div>
                          <div className="flex items-center gap-2 sm:col-span-2 sm:justify-end">
                            <input
                              type="number"
                              value={b.stock}
                              min={0}
                              onChange={(e) =>
                                ubahBaris(i, { stock: e.target.value })
                              }
                              className="tabular w-full rounded-lg border border-slate-300 px-3 py-2 text-right text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 sm:border-0 sm:bg-slate-50"
                            />
                          </div>
                          <div className="hidden items-center justify-end sm:col-span-1 sm:flex">
                            {baris.length > 1 && (
                              <button
                                type="button"
                                onClick={() =>
                                  setBaris((lama) =>
                                    lama.filter((_, idx) => idx !== i),
                                  )
                                }
                                className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                                title="Hapus ukuran"
                              >
                                <IkonTutup className="h-4 w-4" />
                              </button>
                            )}
                          </div>

                          {/* Info laba untuk layar kecil */}
                          <p className="tabular col-span-2 text-xs text-slate-400 sm:hidden">
                            Laba {rupiah(laba)}/pcs
                          </p>
                        </div>
                      );
                    })}
                  </div>

                  {/* Ukuran cepat */}
                  <div className="mt-3 flex flex-wrap items-center gap-1.5">
                    <span className="text-xs text-slate-400">Tambah:</span>
                    {UKURAN_SIAP.map((u) => (
                      <button
                        key={u}
                        type="button"
                        onClick={() => tambahUkuran(u)}
                        className="rounded-md border border-slate-300 px-2 py-1 text-xs font-medium text-slate-600 transition hover:border-emerald-500 hover:bg-emerald-50 hover:text-emerald-700"
                      >
                        {u}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => tambahUkuran()}
                      className="rounded-md border border-dashed border-slate-300 px-2 py-1 text-xs font-medium text-slate-500 hover:border-emerald-500 hover:text-emerald-700"
                    >
                      + Ukuran lain
                    </button>
                  </div>

                  {baris.length > 0 && (
                    <div className="mt-3 flex flex-wrap justify-end gap-4 rounded-lg bg-slate-50 px-3 py-2 text-sm">
                      <span className="text-slate-500">
                        Nilai modal:{" "}
                        <b className="tabular text-slate-800">
                          {rupiah(totalModal)}
                        </b>
                      </span>
                      <span className="text-slate-500">
                        Nilai jual:{" "}
                        <b className="tabular text-slate-800">
                          {rupiah(totalNilaiJual)}
                        </b>
                      </span>
                      <span className="text-slate-500">
                        Potensi laba:{" "}
                        <b className="tabular text-emerald-700">
                          {rupiah(totalNilaiJual - totalModal)}
                        </b>
                      </span>
                    </div>
                  )}
                </div>

                {produk && (
                  <label className="flex items-center gap-2 text-sm text-slate-700">
                    <input
                      type="checkbox"
                      name="isActive"
                      defaultChecked={produk.is_active}
                      className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    Produk aktif (bisa dijual)
                  </label>
                )}

                {status.message && !status.ok && (
                  <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">
                    {status.message}
                  </p>
                )}
              </div>

              <div className="sticky bottom-0 flex gap-2 border-t border-slate-100 bg-white px-5 py-3">
                <button
                  type="button"
                  onClick={() => setTerbuka(false)}
                  className="flex-1 rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={pending}
                  className="flex-1 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-60"
                >
                  {pending ? "Menyimpan..." : "Simpan Produk"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {toast && <Toast pesan={toast} onTutup={() => setToast("")} />}
    </>
  );
}