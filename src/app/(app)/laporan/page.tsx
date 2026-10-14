import { wajibLogin } from "@/lib/auth";
import {
  laporanPembayaran,
  laporanProduk,
  penjualanHarian,
  ringkasan,
} from "@/lib/queries";
import {
  awalBulanWIB,
  awalTahunWIB,
  angka,
  hariIniWIB,
  rupiah,
  tambahHari,
} from "@/lib/format";
import { Judul, Kartu, KartuStat, Kosong, Lencana } from "@/components/ui";
import {
  IkonCek,
  IkonGrafik,
  IkonKeranjang,
  IkonKotak,
  IkonStruk,
} from "@/components/icons";

export const metadata = { title: "Laporan - Kasir Pakaian" };

export default async function HalamanLaporan({
  searchParams,
}: {
  searchParams: Promise<{ dari?: string; sampai?: string }>;
}) {
  await wajibLogin();
  const sp = await searchParams;
  const hariIni = hariIniWIB();

  const dari = sp.dari?.match(/^\d{4}-\d{2}-\d{2}$/)
    ? sp.dari
    : tambahHari(hariIni, -29);
  const sampai = sp.sampai?.match(/^\d{4}-\d{2}-\d{2}$/)
    ? sp.sampai
    : hariIni;

  const [total, harian, produk, pembayaran] = await Promise.all([
    ringkasan(dari, sampai),
    penjualanHarian(dari, sampai),
    laporanProduk(dari, sampai),
    laporanPembayaran(dari, sampai),
  ]);

  const maks = Math.max(...harian.map((h) => h.omzet), 1);
  const margin = total.omzet > 0 ? Math.round((total.laba / total.omzet) * 100) : 0;

  return (
    <>
      <Judul
        judul="Laporan Penjualan"
        deskripsi="Lihat omzet, laba, dan produk mana yang paling laku"
      />

      <form method="get" className="mb-4 flex flex-wrap items-end gap-2">
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500">
            Dari tanggal
          </label>
          <input
            type="date"
            name="dari"
            defaultValue={dari}
            max={hariIni}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500">
            Sampai tanggal
          </label>
          <input
            type="date"
            name="sampai"
            defaultValue={sampai}
            max={hariIni}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
          />
        </div>
        <button
          type="submit"
          className="rounded-lg bg-slate-900 px-5 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
        >
          Tampilkan
        </button>
        <a
          href="/laporan"
          className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
        >
          Reset
        </a>
        <a
          href={`/laporan?dari=${awalBulanWIB()}&sampai=${hariIni}`}
          className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
        >
          Bulan ini
        </a>
        <a
          href={`/laporan?dari=${awalTahunWIB()}&sampai=${hariIni}`}
          className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
        >
          Tahun ini
        </a>
      </form>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KartuStat
          label="Omzet"
          nilai={rupiah(total.omzet)}
          sub={`${total.transaksi} transaksi`}
          Ikon={IkonGrafik}
        />
        <KartuStat
          label="Laba Bersih"
          nilai={rupiah(total.laba)}
          sub={`Margin ${margin}%`}
          Ikon={IkonCek}
          warna="emerald"
        />
        <KartuStat
          label="Modal Terpakai"
          nilai={rupiah(total.modal)}
          sub="Harga beli barang terjual"
          Ikon={IkonKotak}
          warna="rose"
        />
        <KartuStat
          label="Barang Terjual"
          nilai={`${angka(total.qty)} pcs`}
          sub={
            pembayaran.length > 0
              ? `Mayor ${pembayaran[0].metode}`
              : "Belum ada penjualan"
          }
          Ikon={IkonKeranjang}
          warna="amber"
        />
      </div>

      {/* Grafik harian */}
      <Kartu className="mt-4 p-4">
        <h2 className="mb-4 text-sm font-semibold text-slate-800">
          Penjualan Harian
        </h2>
        {total.omzet === 0 ? (
          <Kosong pesan="Belum ada penjualan pada rentang tanggal ini." />
        ) : (
          <>
            <div className="scroll-thin flex h-48 items-end gap-1 overflow-x-auto">
              {harian.map((h) => {
                const tinggi = Math.round((h.omzet / maks) * 100);
                return (
                  <div
                    key={h.label}
                    className="flex min-w-8 flex-1 flex-col items-center gap-1"
                    title={`${h.label}: ${rupiah(h.omzet)}`}
                  >
                    <div className="flex h-36 w-full items-end">
                      <div
                        className="w-full rounded-t bg-emerald-400 hover:bg-emerald-500"
                        style={{ height: `${Math.max(tinggi, h.omzet > 0 ? 5 : 1)}%` }}
                      />
                    </div>
                    <span className="text-[9px] text-slate-400">
                      {h.label.slice(8)}
                    </span>
                  </div>
                );
              })}
            </div>
            <p className="mt-2 text-center text-[11px] text-slate-400">
              Sumbu: jumlah pcs per hari · Total {rupiah(total.omzet)}
            </p>
          </>
        )}
      </Kartu>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        {/* Produk terlaris */}
        <Kartu className="overflow-hidden lg:col-span-2">
          <div className="border-b border-slate-100 px-4 py-3">
            <h2 className="text-sm font-semibold text-slate-800">
              Produk Terlaris
            </h2>
          </div>
          {produk.length === 0 ? (
            <Kosong pesan="Belum ada data penjualan." Ikon={IkonStruk} />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-left text-xs text-slate-500">
                  <tr>
                    <th className="px-4 py-2 font-medium">Produk</th>
                    <th className="px-4 py-2 text-right font-medium">Terjual</th>
                    <th className="px-4 py-2 text-right font-medium">Omzet</th>
                    <th className="px-4 py-2 text-right font-medium">Laba</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {produk.slice(0, 25).map((p) => (
                    <tr key={`${p.product_id}-${p.product_name}`}>
                      <td className="px-4 py-2.5 text-slate-800">
                        {p.product_name}
                      </td>
                      <td className="tabular px-4 py-2.5 text-right text-slate-600">
                        {angka(p.qty)} pcs
                      </td>
                      <td className="tabular px-4 py-2.5 text-right font-medium text-slate-900">
                        {rupiah(p.omzet)}
                      </td>
                      <td className="tabular px-4 py-2.5 text-right font-medium text-emerald-600">
                        {rupiah(p.laba)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Kartu>

        {/* Metode pembayaran */}
        <Kartu className="p-4">
          <h2 className="mb-3 text-sm font-semibold text-slate-800">
            Metode Pembayaran
          </h2>
          {pembayaran.length === 0 ? (
            <Kosong pesan="Belum ada data." Ikon={IkonKeranjang} />
          ) : (
            <ul className="space-y-2">
              {pembayaran.map((p) => (
                <li
                  key={p.metode}
                  className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2.5"
                >
                  <div>
                    <p className="text-sm font-medium text-slate-800">
                      {p.metode}
                    </p>
                    <p className="text-xs text-slate-500">
                      {p.transaksi} transaksi
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="tabular text-sm font-bold text-slate-900">
                      {rupiah(p.omzet)}
                    </p>
                    <Lencana warna="emerald">
                      {Math.round((p.omzet / total.omzet) * 100)}%
                    </Lencana>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Kartu>
      </div>
    </>
  );
}