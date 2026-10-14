import Link from "next/link";
import { statistikDashboard } from "@/lib/queries";
import { wajibLogin } from "@/lib/auth";
import { angka, hariIniWIB, rupiah, tanggal } from "@/lib/format";
import { Kartu, KartuStat, Judul, Kosong, Lencana } from "@/components/ui";
import {
  IkonCek,
  IkonGrafik,
  IkonKeranjang,
  IkonKotak,
  IkonStruk,
} from "@/components/icons";

export const metadata = { title: "Dashboard - Kasir Pakaian" };

export default async function HalamanDashboard() {
  const user = await wajibLogin();
  const data = await statistikDashboard();

  const maksOmzet = Math.max(...data.grafik.map((g) => g.omzet), 1);
  const naik = data.hariIni.omzet - data.kemarin.omzet;

  return (
    <>
      <Judul
        judul={`Halo, ${user.name.split(" ")[0]} 👋`}
        deskripsi={`Ringkasan toko per ${tanggal(hariIniWIB() + "T00:00:00+07:00")}`}
        aksi={
          <Link
            href="/kasir"
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700"
          >
            <IkonKeranjang className="h-4 w-4" />
            Transaksi Baru
          </Link>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KartuStat
          label="Omzet Hari Ini"
          nilai={rupiah(data.hariIni.omzet)}
          sub={
            data.kemarin.transaksi > 0
              ? `Kemarin ${rupiah(data.kemarin.omzet)} (${naik >= 0 ? "+" : ""}${angka(naik)})`
              : "Belum ada pembanding kemarin"
          }
          Ikon={IkonGrafik}
        />
        <KartuStat
          label="Laba Hari Ini"
          nilai={rupiah(data.hariIni.laba)}
          sub={`Modal ${rupiah(data.hariIni.modal)}`}
          Ikon={IkonCek}
          warna="blue"
        />
        <KartuStat
          label="Transaksi"
          nilai={`${data.hariIni.transaksi} / ${data.bulanIni.transaksi}`}
          sub={`${angka(data.hariIni.qty)} pcs hari ini`}
          Ikon={IkonStruk}
          warna="amber"
        />
        <KartuStat
          label="Total Stok"
          nilai={`${angka(data.totalStok)} pcs`}
          sub={`${angka(data.jumlahProduk)} produk aktif`}
          Ikon={IkonKotak}
          warna="slate"
        />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        {/* Grafik 7 hari */}
        <Kartu className="p-4 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-800">
              Penjualan 7 hari terakhir
            </h2>
            <Link
              href="/laporan"
              className="text-xs font-semibold text-emerald-600 hover:text-emerald-700"
            >
              Laporan lengkap
            </Link>
          </div>

          <div className="flex h-44 items-end gap-2">
            {data.grafik.map((hari, i) => {
              const tinggi = Math.round((hari.omzet / maksOmzet) * 100);
              const akhir = i === data.grafik.length - 1;
              return (
                <div key={hari.label} className="flex flex-1 flex-col items-center gap-1.5">
                  <span className="tabular text-[10px] font-medium text-slate-500">
                    {hari.omzet > 0 ? angka(hari.omzet) : ""}
                  </span>
                  <div className="flex h-28 w-full items-end">
                    <div
                      className={`w-full rounded-t-md transition ${
                        akhir ? "bg-emerald-500" : "bg-slate-200"
                      }`}
                      style={{ height: `${Math.max(tinggi, hari.omzet > 0 ? 6 : 2)}%` }}
                      title={`${hari.label}: ${rupiah(hari.omzet)}`}
                    />
                  </div>
                  <span
                    className={`text-[10px] ${akhir ? "font-bold text-emerald-700" : "text-slate-500"}`}
                  >
                    {new Intl.DateTimeFormat("id-ID", {
                      weekday: "short",
                      timeZone: "Asia/Jakarta",
                    }).format(new Date(hari.label + "T00:00:00+07:00"))}
                  </span>
                </div>
              );
            })}
          </div>
        </Kartu>

        {/* Stok menipis */}
        <Kartu className="flex flex-col p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-800">Stok Menipis</h2>
            <Link
              href="/produk"
              className="text-xs font-semibold text-emerald-600 hover:text-emerald-700"
            >
              Kelola stok
            </Link>
          </div>

          {data.stokMenipis.length === 0 ? (
            <Kosong pesan="Stok semua ukuran masih aman." Ikon={IkonCek} />
          ) : (
            <ul className="-mx-1 flex-1 space-y-1">
              {data.stokMenipis.map((item) => (
                <li
                  key={`${item.product_name}-${item.size}`}
                  className="flex items-center justify-between rounded-lg px-2 py-2 hover:bg-slate-50"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-800">
                      {item.product_name}
                    </p>
                    <p className="text-xs text-slate-400">Ukuran {item.size}</p>
                  </div>
                  <Lencana warna={item.stock === 0 ? "rose" : "amber"}>
                    {item.stock === 0 ? "Habis" : `${item.stock} pcs`}
                  </Lencana>
                </li>
              ))}
            </ul>
          )}
        </Kartu>
      </div>

      {/* Transaksi terakhir */}
      <Kartu className="mt-4 overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
          <h2 className="text-sm font-semibold text-slate-800">
            Transaksi Terakhir
          </h2>
          <Link
            href="/penjualan"
            className="text-xs font-semibold text-emerald-600 hover:text-emerald-700"
          >
            Lihat semua
          </Link>
        </div>

        {data.transaksiTerakhir.length === 0 ? (
          <Kosong
            pesan="Belum ada penjualan. Mulai dari menu Kasir."
            Ikon={IkonStruk}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs text-slate-500">
                <tr>
                  <th className="px-4 py-2.5 font-medium">Kode</th>
                  <th className="px-4 py-2.5 font-medium">Waktu</th>
                  <th className="px-4 py-2.5 font-medium">Pelanggan</th>
                  <th className="px-4 py-2.5 font-medium text-right">Item</th>
                  <th className="px-4 py-2.5 font-medium text-right">Total</th>
                  <th className="px-4 py-2.5 font-medium text-right">Laba</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.transaksiTerakhir.map((s) => (
                  <tr key={s.id}>
                    <td className="tabular px-4 py-2.5 font-medium text-slate-800">
                      {s.code}
                    </td>
                    <td className="px-4 py-2.5 text-slate-500">
                      {new Intl.DateTimeFormat("id-ID", {
                        dateStyle: "medium",
                        timeStyle: "short",
                        timeZone: "Asia/Jakarta",
                      }).format(new Date(s.sold_at))}
                    </td>
                    <td className="px-4 py-2.5 text-slate-600">
                      {s.customer || "-"}
                    </td>
                    <td className="tabular px-4 py-2.5 text-right text-slate-600">
                      {s.items.reduce((a, b) => a + b.qty, 0)} pcs
                    </td>
                    <td className="tabular px-4 py-2.5 text-right font-semibold text-slate-800">
                      {rupiah(s.total)}
                    </td>
                    <td className="tabular px-4 py-2.5 text-right font-medium text-emerald-600">
                      {rupiah(s.profit)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Kartu>
    </>
  );
}