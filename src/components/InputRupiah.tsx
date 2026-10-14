"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Input angka rupiah: user mengetik "45000" lalu tampil "45.000".
 * Nilai yang dikirim ke server tetap angka polos.
 */
export default function InputRupiah({
  name,
  defaultValue,
  placeholder = "0",
  className = "",
  inputMode = "numeric",
  onValue,
}: {
  name: string;
  defaultValue?: number | string;
  placeholder?: string;
  className?: string;
  inputMode?: "numeric" | "decimal";
  onValue?: (nilai: number) => void;
}) {
  const [digit, setDigit] = useState<string>(() => {
    const angkaAwal = Math.trunc(Number(defaultValue) || 0);
    return angkaAwal > 0 ? String(angkaAwal) : "";
  });
  const ref = useRef<HTMLInputElement>(null);

  const tampil =
    digit === ""
      ? ""
      : new Intl.NumberFormat("id-ID").format(Number(digit));

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const akhir = el.value.length;
    el.setSelectionRange(akhir, akhir);
  }, [tampil]);

  return (
    <input
      ref={ref}
      type="text"
      name={name}
      inputMode={inputMode}
      value={tampil}
      placeholder={placeholder}
      onChange={(e) => {
        const bersih = e.target.value.replace(/\D/g, "");
        setDigit(bersih);
        onValue?.(Number(bersih) || 0);
      }}
      className={`tabular w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-right text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 ${className}`}
    />
  );
}