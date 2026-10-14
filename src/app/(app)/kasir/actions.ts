"use server";

import { randomBytes, randomUUID } from "node:crypto";
import { wajibLogin } from "@/lib/auth";
import { n, placeholders, q } from "@/lib/db";
import { bulat2, dariInputTanggalWaktu, parseAngka } from "@/lib/format";
import { opsiProdukKasir, type OpsiProduk } from "@/lib/queries";

export type HasilKasir = {
  ok: boolean;
  message: string;
  code?: string;
  total?: number;
  laba?: number;
  kembalian?: number;
};

export type ItemTerdaftar = {
  sizeId: string;
  qty: number;
  sellPrice: number;
};

/** Pencarian produk untuk keranjang kasir (dipanggil dari browser). */
export async function cariProduk(kataKunci: string): Promise<OpsiProduk[]> {
  await wajibLogin();
  return opsiProdukKasir(String(kataKunci ?? "").slice(0, 60));
}

/**
 * Simpan satu transaksi penjualan + kurangi stok.
 *
 * Semua dikerjakan dalam SATU pernyataan SQL supaya:
 *  - stok tidak pernahminus,
 *  - transaksi tidak pernah tercatat setengah jalan.
 */
export async function simpanPenjualan(
  _prev: HasilKasir | null,
  formData: FormData,
): Promise<HasilKasir> {
  const user = await wajibLogin();

  // --- baca & rapikan keranjang -------------------------------------
  let mentah: ItemTerdaftar[];
  try {
    mentah = JSON.parse(String(formData.get("items") ?? "[]")) as ItemTerdaftar[];
  } catch {
    return { ok: false, message: "Keranjang tidak terbaca. Coba muat ulang." };
  }

  const gabung = new Map<string, ItemTerdaftar>();
  for (const item of mentah) {
    const sizeId = String(item.sizeId ?? "");
    const qty = Math.trunc(parseAngka(item.qty));
    if (!sizeId || qty <= 0) continue;
    const harga = Math.max(0, parseAngka(item.sellPrice));
    const lama = gabung.get(sizeId);
    gabung.set(sizeId, {
      sizeId,
      qty: (lama?.qty ?? 0) + qty,
      sellPrice: harga,
    });
  }
  const items = [...gabung.values()];
  if (items.length === 0) {
    return { ok: false, message: "Keranjang masih kosong." };
  }

  // --- ambil data produk terbaru dari database -----------------------
  const baris = await q(
    `select ps.id, ps.product_id, ps.size, ps.buy_price, ps.sell_price, ps.stock, p.name
       from product_sizes ps
       join products p on p.id = ps.product_id
      where ps.id in (${placeholders(items.length)})`,
    items.map((i) => i.sizeId),
  );

  const peta = new Map(
    (baris as Record<string, unknown>[]).map((r) => [
      r.id as string,
      {
        product_id: r.product_id as string,
        size: r.size as string,
        name: r.name as string,
        buy: n(r.buy_price),
        defaultSell: n(r.sell_price),
        stock: n(r.stock),
      },
    ]),
  );

  for (const item of items) {
    if (!peta.has(item.sizeId)) {
      return { ok: false, message: "Ada produk di keranjang yang sudah tidak ada." };
    }
  }

  // --- hitung total ----------------------------------------------------
  const discount = Math.max(0, parseAngka(formData.get("discount")));
  const received = Math.max(0, parseAngka(formData.get("received")));
  const customer = String(formData.get("customer") ?? "").trim();
  const note = String(formData.get("note") ?? "").trim();
  const payment =
    String(formData.get("payment") ?? "Tunai").trim() || "Tunai";
  const soldAt = dariInputTanggalWaktu(
    String(formData.get("soldAt") ?? ""),
  );

  let subtotal = 0;
  let costTotal = 0;
  const detail = items.map((item) => {
    const p = peta.get(item.sizeId)!;
    const harga = item.sellPrice > 0 ? item.sellPrice : p.defaultSell;
    subtotal += harga * item.qty;
    costTotal += p.buy * item.qty;
    return {
      size_id: item.sizeId,
      product_id: p.product_id,
      product_name: p.name,
      size: p.size,
      qty: item.qty,
      buy_price: bulat2(p.buy),
      sell_price: bulat2(harga),
      stock: p.stock,
      name: p.name,
    };
  });

  const diskonDipakai = Math.min(discount, subtotal);
  const total = bulat2(subtotal - diskonDipakai);
  const laba = bulat2(total - costTotal);
  const kembalian = payment === "Tunai" ? bulat2(Math.max(0, received - total)) : 0;

  const kurang = detail.filter((d) => d.qty > d.stock);
  if (kurang.length > 0) {
    return {
      ok: false,
      message: `Stok tidak cukup: ${kurang
        .map((d) => `${d.name} (${d.size}) sisa ${d.stock}`)
        .join(", ")}`,
    };
  }

  const saleId = randomUUID();
  const kode = buatKode(soldAt);

  // jsonb untuk daftar item
  const jsonItems = JSON.stringify(
    detail.map((d) => ({
      size_id: d.size_id,
      product_id: d.product_id,
      product_name: d.product_name,
      size: d.size,
      qty: d.qty,
      buy_price: d.buy_price,
      sell_price: d.sell_price,
    })),
  );

  const sqlStatement = `
    with items as (
      select size_id, product_id, product_name, size, qty, buy_price, sell_price
        from jsonb_to_recordset($2::jsonb) as x(
          size_id text, product_id text, product_name text, size text,
          qty int, buy_price numeric, sell_price numeric)
    ),
    avail as (
      select (select count(*)::int from items) as total,
             (select count(*)::int
                from product_sizes ps
                join items i on ps.id = i.size_id::uuid
               where ps.stock >= i.qty) as cukup
    ),
    upd as (
      update product_sizes ps
         set stock = ps.stock - i.qty, updated_at = now()
        from items i
       where ps.id = i.size_id::uuid
         and (select cukup = total from avail)
      returning ps.id
    ),
    sale as (
      insert into sales (id, code, user_id, customer, payment_method, sold_at,
                         total, subtotal, discount, cost_total, profit,
                         received, change_due, note)
      select $1::uuid, $3, $4::uuid, $5, $6, $7::timestamptz,
             $8, $9, $10, $11, $12, $13, $14, $15
       where (select cukup = total from avail)
      returning id
    )
    insert into sale_items (sale_id, product_id, size_id, product_name, size,
                            qty, buy_price, sell_price, subtotal)
    select s.id, i.product_id::uuid, i.size_id::uuid, i.product_name, i.size,
           i.qty, i.buy_price, i.sell_price, i.sell_price * i.qty
      from sale s
      join items i on true
    returning (select count(*)::int from upd) as updated`;

  const hasil = await q(sqlStatement, [
    saleId,
    jsonItems,
    kode,
    user.id,
    customer,
    payment,
    soldAt.toISOString(),
    total,
    bulat2(subtotal),
    bulat2(diskonDipakai),
    bulat2(costTotal),
    laba,
    received,
    kembalian,
    note,
  ]);

  if (hasil.length === 0) {
    const terbaru = await q(
      `select p.name, ps.size, ps.stock
         from product_sizes ps
         join products p on p.id = ps.product_id
        where ps.id in (${placeholders(items.length)})
        order by ps.stock asc`,
      items.map((i) => i.sizeId),
    );
    const info = (terbaru as Record<string, unknown>[])
      .map((r) => `${r.name} (${r.size}) sisa ${n(r.stock)}`)
      .join(", ");
    return {
      ok: false,
      message: `Stok tidak cukup atau berubah. Stok sekarang: ${info || "tidak ditemukan"}`,
    };
  }

  return {
    ok: true,
    message: `Transaksi ${kode} berhasil disimpan.`,
    code: kode,
    total,
    laba,
    kembalian,
  };
}

/** Kode transaksi: TRX-141026-A1B2 */
function buatKode(soldAt: Date): string {
  const tgl = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "2-digit",
    month: "2-digit",
    day: "2-digit",
  })
    .format(soldAt)
    .replace(/-/g, "");
  return `TRX-${tgl}-${randomBytes(2).toString("hex").toUpperCase()}`;
}
