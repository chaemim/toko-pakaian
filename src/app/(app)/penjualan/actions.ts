"use server";

import { wajibLogin } from "@/lib/auth";
import { db, q } from "@/lib/db";

export type HasilAksi = { ok: boolean; message: string };

/**
 * Hapus transaksi penjualan. Stok barang yang sudah terjual
 * otomatis dikembalikan ke gudang.
 */
export async function hapusPenjualan(
  _prev: HasilAksi | null,
  formData: FormData,
): Promise<HasilAksi> {
  await wajibLogin();
  const id = String(formData.get("id") ?? "").trim();
  if (!id) return { ok: false, message: "Transaksi tidak ditemukan." };

  const sql = db();
  const rows = await q("select code from sales where id = $1", [id]);
  if (rows.length === 0) {
    return { ok: false, message: "Transaksi sudah tidak ada." };
  }
  const kode = rows[0].code as string;

  await sql.transaction([
    sql`
      update product_sizes ps
         set stock = ps.stock + agg.qty, updated_at = now()
        from (
          select size_id, sum(qty)::int as qty
            from sale_items
           where sale_id = ${id} and size_id is not null
           group by size_id
        ) agg
       where ps.id = agg.size_id`,
    sql`
      update product_sizes ps
         set stock = ps.stock + agg.qty, updated_at = now()
        from (
          select product_id::text as product_id, size, sum(qty)::int as qty
            from sale_items
           where sale_id = ${id} and size_id is null and product_id is not null
           group by product_id, size
        ) agg
       where ps.product_id = agg.product_id::uuid
         and lower(ps.size) = lower(agg.size)`,
    sql`delete from sales where id = ${id}`,
  ]);

  return { ok: true, message: `Transaksi ${kode} dihapus, stok dikembalikan.` };
}