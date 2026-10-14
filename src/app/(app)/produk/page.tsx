import { wajibLogin } from "@/lib/auth";
import { daftarKategori, daftarProduk } from "@/lib/queries";
import { Judul } from "@/components/ui";
import { IkonCari } from "@/components/icons";
import ProductManager from "./ProductManager";

export const metadata = { title: "Stok & Harga - Kasir Pakaian" };

export default async function HalamanProduk({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; kategori?: string }>;
}) {
  await wajibLogin();
  const sp = await searchParams;
  const q = sp.q?.trim() ?? "";
  const kategori = sp.kategori ?? "";

  const [products, daftarKategoriList] = await Promise.all([
    daftarProduk({ search: q, kategori }),
    daftarKategori(),
  ]);

  return (
    <>
      <Judul
        judul="Stok & Harga"
        deskripsi="Catat harga beli, harga jual, dan stok setiap ukuran pakaian"
      />

      <form
        method="get"
        className="mb-4 flex flex-col gap-2 sm:flex-row"
      >
        <div className="relative flex-1">
          <IkonCari className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            name="q"
            defaultValue={q}
            placeholder="Cari nama produk atau kategori..."
            className="w-full rounded-lg border border-slate-300 bg-white py-2.5 pr-3 pl-9 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
          />
        </div>
        <select
          name="kategori"
          defaultValue={kategori}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
        >
          <option value="">Semua kategori</option>
          {daftarKategoriList.map((k) => (
            <option key={k} value={k}>
              {k}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
        >
          Cari
        </button>
      </form>

      <ProductManager products={products} kategori={daftarKategoriList} />
    </>
  );
}