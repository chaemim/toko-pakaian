"use server";

import { wajibLogin } from "@/lib/auth";
import { n, placeholders, q } from "@/lib/db";
import { parseAngka } from "@/lib/format";

export type BarisUkuran = {
  size: string;
  buy: number;
  sell: number;
  stock: number;
};

export type HasilAksi = { ok: boolean; message: string };

/**
 * Simpan produk baru / ubah produk lama.
 * Ukuran dicocokkan berdasarkan teksnya, jadi stok tidak hilang
 * saat produk diedit (hanya ukuran yang dihapus_user yang hilang).
 */
export async function simpanProduk(
  _prev: HasilAksi | null,
  formData: FormData,
): Promise<HasilAksi> {
  await wajibLogin();

  const id = String(formData.get("id") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const category = String(formData.get("category") ?? "").trim();
  const note = String(formData.get("note") ?? "").trim();
  // Produk baru selalu aktif; produk lama mengikuti checkbox di form
  const isActive = id ? formData.get("isActive") === "on" : true;

  if (!name) return { ok: false, message: "Nama produk wajib diisi." };

  let ukuran: BarisUkuran[] = [];
  try {
    ukuran = JSON.parse(String(formData.get("sizes") ?? "[]")) as BarisUkuran[];
  } catch {
    return { ok: false, message: "Data ukuran tidak terbaca. Coba muat ulang halaman." };
  }

  const sizes = ukuran
    .map((s) => ({
      size: String(s.size ?? "").trim(),
      buy: Math.max(0, parseAngka(s.buy)),
      sell: Math.max(0, parseAngka(s.sell)),
      stock: Math.trunc(parseAngka(s.stock)),
    }))
    .filter((s) => s.size.length > 0);

  if (sizes.length === 0) {
    return { ok: false, message: "Minimal isi satu ukuran." };
  }
  if (sizes.some((s) => s.stock < 0)) {
    return { ok: false, message: "Stok tidak boleh minus." };
  }
  const kunci = sizes.map((s) => s.size.toLowerCase());
  if (new Set(kunci).size !== kunci.length) {
    return { ok: false, message: "Ada ukuran yang sama lebih dari sekali." };
  }

  const lama = id
    ? (
        await q(
          "select id, size, stock from product_sizes where product_id = $1",
          [id],
        )
      ).map((r) => ({
        size: String(r.size).toLowerCase(),
        stock: n(r.stock),
      }))
    : [];

  // Cegah ukuran dengan stok hilang tidak sengaja (mis. saat memotong baris)
  const ukuranHilang = lama.filter(
    (l) => !kunci.includes(l.size) && l.stock > 0,
  );
  if (ukuranHilang.length > 0) {
    return {
      ok: false,
      message: `Ukuran ${ukuranHilang.map((u) => u.size.toUpperCase()).join(", ")} masih ada stoknya. Set stok jadi 0 dulu jika memang mau dihapus.`,
    };
  }

  let productId = id;
  if (id) {
    await q(
      `update products set name = $2, category = $3, note = $4, is_active = $5, updated_at = now()
        where id = $1`,
      [id, name, category, note, isActive],
    );
    await q(
      `delete from product_sizes
        where product_id = $1 and lower(size) not in (${placeholders(kunci.length, 2)})`,
      [id, ...kunci],
    );
    const sudahAda = new Set(lama.map((l) => l.size));
    for (const s of sizes) {
      if (sudahAda.has(s.size.toLowerCase())) {
        await q(
          `update product_sizes
              set buy_price = $3, sell_price = $4, stock = $5, updated_at = now()
            where product_id = $1 and lower(size) = $2`,
          [id, s.size.toLowerCase(), s.buy, s.sell, s.stock],
        );
      } else {
        await q(
          `insert into product_sizes (product_id, size, buy_price, sell_price, stock)
           values ($1, $2, $3, $4, $5)`,
          [id, s.size, s.buy, s.sell, s.stock],
        );
      }
    }
  } else {
    const rows = await q(
      `insert into products (name, category, note, is_active)
       values ($1, $2, $3, $4) returning id`,
      [name, category, note, isActive],
    );
    productId = rows[0].id as string;
    for (const s of sizes) {
      await q(
        `insert into product_sizes (product_id, size, buy_price, sell_price, stock)
         values ($1, $2, $3, $4, $5)`,
        [productId, s.size, s.buy, s.sell, s.stock],
      );
    }
  }

  return {
    ok: true,
    message: id ? `Produk "${name}" diperbarui.` : `Produk "${name}" ditambahkan.`,
  };
}

export async function hapusProduk(formData: FormData): Promise<HasilAksi> {
  await wajibLogin();
  const id = String(formData.get("id") ?? "").trim();
  if (!id) return { ok: false, message: "Produk tidak ditemukan." };

  const rows = await q(
    "select name from products where id = $1",
    [id],
  );
  if (rows.length === 0) return { ok: false, message: "Produk tidak ditemukan." };

  await q("delete from products where id = $1", [id]);
  return { ok: true, message: `Produk "${rows[0].name}" dihapus.` };
}
