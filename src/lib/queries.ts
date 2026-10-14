import { n, placeholders, q, type Baris } from "./db";
import { rentangHariWIB, hariIniWIB, tambahHari, awalBulanWIB } from "./format";
import type {
  BarisLaporan,
  Product,
  ProductSize,
  Sale,
  SaleItem,
  Summary,
} from "./types";

function keBaris<T>(rows: unknown): T[] {
  return (rows ?? []) as T[];
}

/* ============================ PRODUK ============================ */

function keProduk(rows: unknown, ukuranRows: unknown[]): Product[] {
  const hasil = keBaris<Baris>(rows);
  const groups = new Map<string, ProductSize[]>();
  for (const row of keBaris<Baris>(ukuranRows)) {
    const size: ProductSize = {
      id: row.id as string,
      product_id: row.product_id as string,
      size: row.size as string,
      buy_price: n(row.buy_price),
      sell_price: n(row.sell_price),
      stock: n(row.stock),
    };
    const list = groups.get(size.product_id) ?? [];
    list.push(size);
    groups.set(size.product_id, list);
  }
  return hasil.map((row) => ({
    id: row.id as string,
    name: row.name as string,
    category: (row.category as string) ?? "",
    note: (row.note as string) ?? "",
    is_active: Boolean(row.is_active),
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
    sizes: (groups.get(row.id as string) ?? []).sort((a, b) =>
      a.size.localeCompare(b.size, "id", { numeric: true }),
    ),
  }));
}

/** Ambil baris ukuran untuk daftar id produk (dalam 1 query). */
async function semuaUkuran(productIds: string[]): Promise<unknown[]> {
  if (productIds.length === 0) return [];
  return q(
    `select id, product_id, size, buy_price, sell_price, stock
       from product_sizes where product_id in (${placeholders(productIds.length)})`,
    productIds,
  );
}

export type FilterProduk = {
  search?: string;
  kategori?: string;
  hanyaAktif?: boolean;
};

export async function daftarProduk(filter: FilterProduk = {}): Promise<Product[]> {
  const syarat: string[] = [];
  const nilai: unknown[] = [];

  if (filter.search) {
    nilai.push(`%${filter.search.trim()}%`);
    syarat.push(`(p.name ilike $${nilai.length} or p.category ilike $${nilai.length})`);
  }
  if (filter.kategori) {
    nilai.push(filter.kategori);
    syarat.push(`p.category = $${nilai.length}`);
  }
  if (filter.hanyaAktif !== false) {
    syarat.push("p.is_active = true");
  }

  const where = syarat.length ? `where ${syarat.join(" and ")}` : "";
  const rows = await q(
    `select p.id, p.name, p.category, p.note, p.is_active, p.created_at, p.updated_at
       from products p ${where}
      order by p.name asc`,
    nilai,
  );

  const ids = (rows as Baris[]).map((r) => r.id as string);
  return keProduk(rows, await semuaUkuran(ids));
}

export async function ambilProduk(id: string): Promise<Product | null> {
  const rows = await q(
    `select id, name, category, note, is_active, created_at, updated_at
       from products where id = $1`,
    [id],
  );
  if (rows.length === 0) return null;
  return keProduk(rows, await semuaUkuran([id]))[0] ?? null;
}

export async function daftarKategori(): Promise<string[]> {
  const rows = await q(
    "select distinct category from products where category <> '' order by category asc",
  );
  return (rows as Baris[]).map((r) => r.category as string);
}

export type OpsiProduk = {
  id: string;
  name: string;
  category: string;
  sizes: { id: string; size: string; sell_price: number; buy_price: number; stock: number }[];
};

/** Data ringkas untuk halaman Kasir (pencarian produk). */
export async function opsiProdukKasir(search = ""): Promise<OpsiProduk[]> {
  const params: unknown[] = [];
  let where = "where p.is_active = true";
  if (search.trim()) {
    params.push(`%${search.trim()}%`);
    where += ` and (p.name ilike $${params.length} or p.category ilike $${params.length})`;
  }

  const [produkRows, sizeRows] = await Promise.all([
    q(
      `select p.id, p.name, p.category from products p ${where} order by p.name asc limit 60`,
      params,
    ),
    q(
      `select ps.id, ps.product_id, ps.size, ps.sell_price, ps.buy_price, ps.stock
         from product_sizes ps
         join (
           select p.id from products p ${where} order by p.name asc limit 60
         ) x on x.id = ps.product_id`,
      params,
    ),
  ]);

  const products = produkRows as Baris[];
  const byProduct = new Map<string, OpsiProduk["sizes"]>();
  for (const row of sizeRows as Baris[]) {
    const list = byProduct.get(row.product_id as string) ?? [];
    list.push({
      id: row.id as string,
      size: row.size as string,
      sell_price: n(row.sell_price),
      buy_price: n(row.buy_price),
      stock: n(row.stock),
    });
    byProduct.set(row.product_id as string, list);
  }

  return products.map((row) => ({
    id: row.id as string,
    name: row.name as string,
    category: (row.category as string) ?? "",
    sizes: (byProduct.get(row.id as string) ?? []).sort((a, b) =>
      a.size.localeCompare(b.size, "id", { numeric: true }),
    ),
  }));
}

/* =========================== PENJUALAN =========================== */

export type FilterPenjualan = {
  dari: string; // YYYY-MM-DD (WIB)
  sampai: string; // YYYY-MM-DD (WIB)
  cari?: string;
};

export async function daftarPenjualan(
  filter: FilterPenjualan,
): Promise<Sale[]> {
  const { end } = rentangHariWIB(filter.sampai);
  const { start: dari } = rentangHariWIB(filter.dari);

  const params: unknown[] = [dari, end];
  let where = "where s.sold_at >= $1 and s.sold_at < $2";
  if (filter.cari?.trim()) {
    params.push(`%${filter.cari.trim()}%`);
    where += ` and (s.code ilike $${params.length} or s.customer ilike $${params.length})`;
  }

  const salesRows = await q(
    `select s.*, u.name as user_name
       from sales s
       left join users u on u.id = s.user_id
       ${where}
      order by s.sold_at desc
      limit 300`,
    params,
  );

  const sales = salesRows as Baris[];
  const ids = sales.map((r) => r.id as string);
  let items: Baris[] = [];
  if (ids.length > 0) {
    const itemRows = await q(
      `select id, sale_id, product_id, size_id, product_name, size, qty, buy_price, sell_price, subtotal
         from sale_items where sale_id in (${placeholders(ids.length)}) order by id asc`,
      ids,
    );
    items = itemRows as Baris[];
  }

  const itemsBySale = new Map<string, SaleItem[]>();
  for (const row of items) {
    const item: SaleItem = {
      id: row.id as string,
      sale_id: row.sale_id as string,
      product_id: (row.product_id as string) ?? null,
      product_name: row.product_name as string,
      size: row.size as string,
      qty: n(row.qty),
      buy_price: n(row.buy_price),
      sell_price: n(row.sell_price),
      subtotal: n(row.subtotal),
    };
    const list = itemsBySale.get(item.sale_id) ?? [];
    list.push(item);
    itemsBySale.set(item.sale_id, list);
  }

  return sales.map((row) => ({
    id: row.id as string,
    code: row.code as string,
    user_id: (row.user_id as string) ?? null,
    customer: (row.customer as string) ?? "",
    payment_method: row.payment_method as string,
    sold_at: row.sold_at as string,
    subtotal: n(row.subtotal),
    discount: n(row.discount),
    total: n(row.total),
    cost_total: n(row.cost_total),
    profit: n(row.profit),
    received: n(row.received),
    change_due: n(row.change_due),
    note: (row.note as string) ?? "",
    items: itemsBySale.get(row.id as string) ?? [],
  }));
}

/* ====================== RINGKASAN & LAPORAN ====================== */

export async function ringkasan(dari: string, sampai: string): Promise<Summary> {
  const start = rentangHariWIB(dari).start;
  const end = rentangHariWIB(sampai).end;

  const rows = await q(
    `select
        coalesce(sum(total), 0)      as omzet,
        coalesce(sum(cost_total), 0) as modal,
        coalesce(sum(profit), 0)     as laba,
        count(*)                     as transaksi
       from sales
      where sold_at >= $1 and sold_at < $2`,
    [start, end],
  );
  const row = (rows as Baris[])[0] ?? {};
  const qtyRows = await q(
    `select coalesce(sum(si.qty), 0) as qty
       from sale_items si
       join sales s on s.id = si.sale_id
      where s.sold_at >= $1 and s.sold_at < $2`,
    [start, end],
  );

  return {
    omzet: n(row.omzet),
    modal: n(row.modal),
    laba: n(row.laba),
    transaksi: n(row.transaksi),
    qty: n((qtyRows as Baris[])[0]?.qty),
  };
}

/** Penjualan per hari (WIB) untuk grafik. */
export async function penjualanHarian(
  dari: string,
  sampai: string,
): Promise<BarisLaporan[]> {
  const start = rentangHariWIB(dari).start;
  const end = rentangHariWIB(sampai).end;

  const rows = await q(
    `select to_char(((sold_at + interval '7 hours')::date), 'YYYY-MM-DD') as label,
            coalesce(sum(total), 0)  as omzet,
            coalesce(sum(profit), 0) as laba,
            count(*)                 as transaksi
       from sales
      where sold_at >= $1 and sold_at < $2
      group by 1`,
    [start, end],
  );

  const peta = new Map(
    (rows as Baris[]).map((r) => [
      r.label as string,
      {
        label: r.label as string,
        omzet: n(r.omzet),
        laba: n(r.laba),
        transaksi: n(r.transaksi),
      },
    ]),
  );

  const hasil: BarisLaporan[] = [];
  let cursor = dari;
  let guard = 0;
  while (cursor <= sampai && guard < 400) {
    hasil.push(
      peta.get(cursor) ?? { label: cursor, omzet: 0, laba: 0, transaksi: 0 },
    );
    cursor = tambahHari(cursor, 1);
    guard += 1;
  }
  return hasil;
}

export type LaporanProduk = {
  product_id: string | null;
  product_name: string;
  qty: number;
  omzet: number;
  modal: number;
  laba: number;
};

export async function laporanProduk(
  dari: string,
  sampai: string,
): Promise<LaporanProduk[]> {
  const start = rentangHariWIB(dari).start;
  const end = rentangHariWIB(sampai).end;

  const rows = await q(
    `select si.product_id::text as product_id,
            si.product_name,
            sum(si.qty)                        as qty,
            sum(si.subtotal)                   as omzet,
            sum(si.buy_price * si.qty)         as modal
       from sale_items si
       join sales s on s.id = si.sale_id
      where s.sold_at >= $1 and s.sold_at < $2
      group by si.product_id::text, si.product_name
      order by omzet desc
      limit 200`,
    [start, end],
  );

  return (rows as Baris[]).map((r) => {
    const omzet = n(r.omzet);
    const modal = n(r.modal);
    return {
      product_id: (r.product_id as string) ?? null,
      product_name: r.product_name as string,
      qty: n(r.qty),
      omzet,
      modal,
      laba: Math.round((omzet - modal) * 100) / 100,
    };
  });
}

export async function laporanPembayaran(
  dari: string,
  sampai: string,
): Promise<{ metode: string; transaksi: number; omzet: number }[]> {
  const start = rentangHariWIB(dari).start;
  const end = rentangHariWIB(sampai).end;
  const rows = await q(
    `select payment_method as metode, count(*) as transaksi, coalesce(sum(total), 0) as omzet
       from sales
      where sold_at >= $1 and sold_at < $2
      group by payment_method
      order by omzet desc`,
    [start, end],
  );
  return (rows as Baris[]).map((r) => ({
    metode: r.metode as string,
    transaksi: n(r.transaksi),
    omzet: n(r.omzet),
  }));
}

/* =========================== DASHBOARD =========================== */

export type StokMenipis = {
  product_name: string;
  size: string;
  stock: number;
  sell_price: number;
};

export async function statistikDashboard() {
  const hariIni = hariIniWIB();
  const kemarin = tambahHari(hariIni, -1);
  const bulanIni = awalBulanWIB();

  const [hariIniSummary, kemarinSummary, bulanIniSummary, produk, stok, menipis, terjual] =
    await Promise.all([
      ringkasan(hariIni, hariIni),
      ringkasan(kemarin, kemarin),
      ringkasan(bulanIni, hariIni),
      q(
        "select count(*)::int as total from products where is_active = true",
      ),
      q(
        `select coalesce(sum(ps.stock), 0)::int as total
           from product_sizes ps
           join products p on p.id = ps.product_id
          where p.is_active = true`,
      ),
      q(
        `select p.name as product_name, ps.size, ps.stock, ps.sell_price
           from product_sizes ps
           join products p on p.id = ps.product_id
          where p.is_active = true and ps.stock <= 5
          order by ps.stock asc, p.name asc
          limit 8`,
      ),
      q(
        `select to_char(((sold_at + interval '7 hours')::date), 'YYYY-MM-DD') as label,
                coalesce(sum(total), 0) as omzet
           from sales
          where sold_at >= $1
          group by 1`,
        [rentangHariWIB(tambahHari(hariIni, -6)).start],
      ),
    ]);

  const petaGrafik = new Map(
    (terjual as Baris[]).map((r) => [r.label as string, n(r.omzet)]),
  );
  const grafik: BarisLaporan[] = [];
  for (let i = 6; i >= 0; i -= 1) {
    const label = tambahHari(hariIni, -i);
    grafik.push({ label, omzet: petaGrafik.get(label) ?? 0, laba: 0, transaksi: 0 });
  }

  const recent = await daftarPenjualan({ dari: tambahHari(hariIni, -60), sampai: hariIni });

  return {
    hariIni: hariIniSummary,
    kemarin: kemarinSummary,
    bulanIni: bulanIniSummary,
    jumlahProduk: n((produk as Baris[])[0]?.total),
    totalStok: n((stok as Baris[])[0]?.total),
    stokMenipis: (menipis as Baris[]).map((r) => ({
      product_name: r.product_name as string,
      size: r.size as string,
      stock: n(r.stock),
      sell_price: n(r.sell_price),
    })) as StokMenipis[],
    grafik,
    transaksiTerakhir: recent.slice(0, 6),
  };
}
