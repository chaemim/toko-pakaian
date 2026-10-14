import { redirect } from "next/navigation";
import { ambilPengguna, jumlahUser } from "@/lib/auth";
import FormLogin from "./FormLogin";

export const metadata = { title: "Masuk - Kasir Pakaian" };

export default async function HalamanLogin() {
  const user = await ambilPengguna();
  if (user) redirect("/dashboard");

  const adaUser = await jumlahUser().catch(() => 0);

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-emerald-600 via-emerald-700 to-slate-900 px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center text-white">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15 text-2xl backdrop-blur">
            👕
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Kasir Pakaian</h1>
          <p className="mt-1 text-sm text-emerald-100/90">
            Catat stok, harga, dan penjualan dengan rapi
          </p>
        </div>

        <div className="rounded-2xl bg-white p-6 shadow-2xl shadow-emerald-950/20">
          <FormLogin />
          {adaUser === 0 && (
            <p className="mt-4 rounded-lg bg-amber-50 px-3 py-2 text-xs leading-relaxed text-amber-800">
              Belum ada user. Jalankan <code>npm run db:setup</code> untuk membuat
              user admin pertama.
            </p>
          )}
        </div>

        <p className="mt-4 text-center text-xs text-emerald-100/70">
          Sesi login bertahan 30 hari, jadi tidak perlu login sering.
        </p>
      </div>
    </main>
  );
}