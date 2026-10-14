import type { SVGProps } from "react";

/** Kartu putih standar */
export function Kartu({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-xl border border-slate-200 bg-white shadow-sm ${className}`}
    >
      {children}
    </div>
  );
}

/** Judul halaman + keterangan */
export function Judul({
  judul,
  deskripsi,
  aksi,
}: {
  judul: string;
  deskripsi?: string;
  aksi?: React.ReactNode;
}) {
  return (
    <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
          {judul}
        </h1>
        {deskripsi && (
          <p className="mt-1 text-sm text-slate-500">{deskripsi}</p>
        )}
      </div>
      {aksi}
    </div>
  );
}

/** Kotak angka ringkasan */
export function KartuStat({
  label,
  nilai,
  sub,
  Ikon,
  warna = "emerald",
}: {
  label: string;
  nilai: string;
  sub?: string;
  Ikon?: (p: SVGProps<SVGSVGElement>) => React.ReactElement;
  warna?: "emerald" | "blue" | "amber" | "rose" | "slate";
}) {
  const warnaIkon = {
    emerald: "bg-emerald-50 text-emerald-600",
    blue: "bg-blue-50 text-blue-600",
    amber: "bg-amber-50 text-amber-600",
    rose: "bg-rose-50 text-rose-600",
    slate: "bg-slate-100 text-slate-600",
  }[warna];

  return (
    <Kartu className="p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs font-medium tracking-wide text-slate-500 uppercase">
            {label}
          </p>
          <p className="tabular mt-1.5 truncate text-xl font-bold text-slate-900">
            {nilai}
          </p>
          {sub && <p className="mt-0.5 text-xs text-slate-400">{sub}</p>}
        </div>
        {Ikon && (
          <div className={`shrink-0 rounded-lg p-2 ${warnaIkon}`}>
            <Ikon className="h-5 w-5" />
          </div>
        )}
      </div>
    </Kartu>
  );
}

/** Tampilan saat belum ada data */
export function Kosong({
  pesan,
  Ikon,
}: {
  pesan: string;
  Ikon?: (p: SVGProps<SVGSVGElement>) => React.ReactElement;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-4 py-12 text-center">
      {Ikon && (
        <div className="rounded-full bg-slate-100 p-3 text-slate-400">
          <Ikon className="h-6 w-6" />
        </div>
      )}
      <p className="text-sm text-slate-500">{pesan}</p>
    </div>
  );
}

/** Lencana kecil (mis. jumlah stok) */
export function Lencana({
  children,
  warna = "slate",
}: {
  children: React.ReactNode;
  warna?: "slate" | "emerald" | "amber" | "rose" | "blue";
}) {
  const kelas = {
    slate: "bg-slate-100 text-slate-600",
    emerald: "bg-emerald-50 text-emerald-700",
    amber: "bg-amber-50 text-amber-700",
    rose: "bg-rose-50 text-rose-700",
    blue: "bg-blue-50 text-blue-700",
  }[warna];
  return (
    <span
      className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold ${kelas}`}
    >
      {children}
    </span>
  );
}