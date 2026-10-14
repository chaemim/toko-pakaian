import { wajibLogin } from "@/lib/auth";
import { daftarPenjualan } from "@/lib/queries";
import { awalBulanWIB, awalTahunWIB, hariIniWIB, rupiah, tambahHari } from "@/lib/format";
import { Judul, KartuStat } from "@/components/ui";
import { IkonGrafik, IkonKeranjang, IkonKemeja, IkonStruk } from "@/components/icons";
import DaftarPenjualanClient from "./DaftarPenjualanClient";

export const metadata = { title: "Penjualan - Kasir Pakaian" };

export default async function HalamanPenjualan({
  searchParams,
}: {
  searchParams: Promise<{ dari?: string; sampai?: string; q?: string }>;
}) {
  await wajibLogin();
  const sp = await searchParams;
  const hariIni = hariIniWIB();

  const dari = sp.dari?.match(/^\d{4}-\d{2}-\d{2}$/) ? sp.dari : awalBulanWIB();
  const sampai = sp.sampai?.match(/^\d{4}-\d{2}-\d{2}$/)
    ? sp.sampai
    : hariIni;
  const q = sp.q ?? "";

  const sales = await daftarPenjualan({ dari, sampai, cari: q });

  const totalOmzet = sales.reduce((a, s) => a + s.total, 0);
  const totalLaba = sales.reduce((a, s) => a + s.profit, 0);
  const totalQty = sales.reduce(
    (a, s) => a + s.items.reduce((x, i) => x + i.qty, 0),
    0,
  );

  return (
    <>
      <Judul
        judul="Riwayat Penjualan"
        deskripsi="Cek transaksi yang sudah masuk, atau hapus jika keliru input"
      />

      {/* Filter tanggal */}
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
        <div className="min-w-40 flex-1">
          <label className="mb-1 block text-xs font-medium text-slate-500">
            Cari kode / pelanggan
          </label>
          <input
            type="search"
            name="q"
            defaultValue={q}
            placeholder="TRX-... atau nama"
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
          />
        </div>
        <button
          type="submit"
          className="rounded-lg bg-slate-900 px-5 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
        >
          Tampilkan
        </button>
        <a
          href={`/penjualan?dari=${awalBulanWIB()}&sampai=${hariIni}`}
          className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
        >
          Bulan ini
        </a>
        <a
          href={`/penjualan?dari=${tambahHari(hariIni, -30)}&sampai=${hariIni}`}
          className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
        >
          30 hari
        </a>
        <a
          href={`/penjualan?dari=${awalTahunWIB()}&sampai=${hariIni}`}
          className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
        >
          Tahun ini
        </a>
      </form>

      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KartuStat
          label="Omzet"
          nilai={rupiah(totalOmzet)}
          sub={`${dari} s/d ${sampai}`}
          Ikon={IkonGrafik}
        />
        <KartuStat
          label="Laba"
          nilai={rupiah(totalLaba)}
          sub="Omzet dikurangi modal"
          Ikon={IkonKeranjang}
          warna="emerald"
        />
        <KartuStat
          label="Transaksi"
          nilai={`${sales.length}`}
          sub={`${totalQty} pcs barang`}
          Ikon={IkonStruk}
          warna="blue"
        />
        <KartuStat
          label="Rata-rata"
          nilai={rupiah(sales.length ? totalOmzet / sales.length : 0)}
          sub="Per transaksi"
          Ikon={IkonKemeja}
          warna="slate"
        />
      </div>

      <DaftarPenjualanClient sales={sales} />
    </>
  );
}