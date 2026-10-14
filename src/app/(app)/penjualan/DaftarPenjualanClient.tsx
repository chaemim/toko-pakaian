"use client";

import { useActionState, useState } from "react";
import { hapusPenjualan, type HasilAksi } from "./actions";
import type { Sale } from "@/lib/types";
import { rupiah, tanggalWaktu } from "@/lib/format";
import { Kartu, Kosong, Lencana } from "@/components/ui";
import { IkonHapus, IkonPanahKanan, IkonStruk } from "@/components/icons";

const AWAL: HasilAksi = { ok: false, message: "" };

export default function DaftarPenjualanClient({
  sales,
}: {
  sales: Sale[];
}) {
  const [buka, setBuka] = useState<string | null>(null);
  const [status, formAction, pending] = useActionState(hapusPenjualan, AWAL);

  if (sales.length === 0) {
    return (
      <Kartu>
        <Kosong
          pesan="Belum ada penjualan pada rentang tanggal ini."
          Ikon={IkonStruk}
        />
      </Kartu>
    );
  }

  return (
    <>
      {status.message && (
        <div
          className={`mb-3 rounded-lg px-3 py-2 text-sm ${
            status.ok
              ? "bg-emerald-50 text-emerald-800"
              : "bg-rose-50 text-rose-700"
          }`}
        >
          {status.message}
        </div>
      )}

      <div className="space-y-2">
        {sales.map((s) => {
          const terbuka = buka === s.id;
          const totalQty = s.items.reduce((a, b) => a + b.qty, 0);

          return (
            <Kartu key={s.id} className="overflow-hidden">
              <div className="flex flex-wrap items-center gap-3 p-3.5">
                <button
                  type="button"
                  onClick={() => setBuka(terbuka ? null : s.id)}
                  className="flex min-w-0 flex-1 items-center gap-3 text-left"
                >
                  <IkonPanahKanan
                    className={`h-4 w-4 shrink-0 text-slate-400 transition ${
                      terbuka ? "rotate-90" : ""
                    }`}
                  />
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="tabular text-sm font-bold text-slate-900">
                        {s.code}
                      </p>
                      <Lencana
                        warna={s.payment_method === "Tunai" ? "emerald" : "blue"}
                      >
                        {s.payment_method}
                      </Lencana>
                    </div>
                    <p className="mt-0.5 text-xs text-slate-500">
                      {tanggalWaktu(s.sold_at)} · {totalQty} pcs
                      {s.customer ? ` · ${s.customer}` : ""}
                    </p>
                  </div>
                </button>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="tabular text-sm font-bold text-slate-900">
                      {rupiah(s.total)}
                    </p>
                    <p className="text-[11px] text-emerald-600">
                      laba {rupiah(s.profit)}
                    </p>
                  </div>
                </div>

                <form action={formAction} className="shrink-0">
                  <input type="hidden" name="id" value={s.id} />
                  <button
                    type="submit"
                    disabled={pending}
                    onClick={(e) => {
                      if (
                        !confirm(
                          `Hapus transaksi ${s.code}?\nStok barang di transaksi ini akan dikembalikan.`,
                        )
                      ) {
                        e.preventDefault();
                      }
                    }}
                    className="rounded-lg p-2 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600 disabled:opacity-50"
                    title="Hapus transaksi"
                  >
                    <IkonHapus className="h-4 w-4" />
                  </button>
                </form>
              </div>

              {terbuka && (
                <div className="border-t border-slate-100 bg-slate-50/60 px-4 py-3">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="text-xs text-slate-500">
                        <tr>
                          <th className="py-1.5 text-left font-medium">Barang</th>
                          <th className="py-1.5 text-center font-medium">Ukuran</th>
                          <th className="py-1.5 text-right font-medium">Qty</th>
                          <th className="py-1.5 text-right font-medium">Harga</th>
                          <th className="py-1.5 text-right font-medium">Jumlah</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200/70">
                        {s.items.map((it) => (
                          <tr key={it.id}>
                            <td className="py-2 text-slate-800">
                              {it.product_name}
                            </td>
                            <td className="py-2 text-center font-semibold text-slate-700">
                              {it.size}
                            </td>
                            <td className="tabular py-2 text-right text-slate-600">
                              {it.qty}
                            </td>
                            <td className="tabular py-2 text-right text-slate-600">
                              {rupiah(it.sell_price)}
                            </td>
                            <td className="tabular py-2 text-right font-semibold text-slate-900">
                              {rupiah(it.subtotal)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="mt-3 space-y-1 border-t border-slate-200 pt-2 text-sm">
                    {s.discount > 0 && (
                      <div className="flex justify-between text-slate-500">
                        <span>Subtotal</span>
                        <span className="tabular">{rupiah(s.subtotal)}</span>
                      </div>
                    )}
                    {s.discount > 0 && (
                      <div className="flex justify-between text-slate-500">
                        <span>Diskon</span>
                        <span className="tabular text-rose-600">
                          − {rupiah(s.discount)}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between font-bold text-slate-900">
                      <span>Total</span>
                      <span className="tabular">{rupiah(s.total)}</span>
                    </div>
                    {s.received > 0 && (
                      <>
                        <div className="flex justify-between text-slate-500">
                          <span>Dibayar</span>
                          <span className="tabular">{rupiah(s.received)}</span>
                        </div>
                        <div className="flex justify-between text-slate-500">
                          <span>Kembalian</span>
                          <span className="tabular">{rupiah(s.change_due)}</span>
                        </div>
                      </>
                    )}
                    {s.note && (
                      <p className="pt-1 text-xs text-slate-500">
                        Catatan: {s.note}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </Kartu>
          );
        })}
      </div>
    </>
  );
}