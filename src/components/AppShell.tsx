"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { keluar } from "@/app/login/actions";
import {
  IkonDashboard,
  IkonGrafik,
  IkonKemeja,
  IkonKeranjang,
  IkonKeluar,
  IkonMenu,
  IkonOrang,
  IkonStruk,
  IkonTutup,
} from "./icons";

const MENU = [
  { href: "/dashboard", label: "Dashboard", Ikon: IkonDashboard },
  { href: "/kasir", label: "Kasir", Ikon: IkonKeranjang },
  { href: "/produk", label: "Stok & Harga", Ikon: IkonKemeja },
  { href: "/penjualan", label: "Penjualan", Ikon: IkonStruk },
  { href: "/laporan", label: "Laporan", Ikon: IkonGrafik },
];

function IsiMenu({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-1 p-3">
      {MENU.map(({ href, label, Ikon }) => {
        const aktif = pathname === href || pathname.startsWith(href + "/");
        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
              aktif
                ? "bg-emerald-600 text-white shadow-sm"
                : "text-slate-300 hover:bg-slate-800 hover:text-white"
            }`}
          >
            <Ikon className="h-5 w-5 shrink-0" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

function Logo() {
  return (
    <div className="flex items-center gap-2.5 px-5 py-4">
      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500 text-lg">
        👕
      </div>
      <div className="leading-tight">
        <p className="text-sm font-bold text-white">Kasir Pakaian</p>
        <p className="text-[11px] text-slate-400">Catatan Penjualan</p>
      </div>
    </div>
  );
}

export default function AppShell({
  user,
  children,
}: {
  user: { name: string; username: string };
  children: React.ReactNode;
}) {
  const [buka, setBuka] = useState(false);

  return (
    <div className="min-h-screen bg-slate-100">
      {/* Sidebar untuk layar besar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col bg-slate-900 lg:flex">
        <Logo />
        <IsiMenu />
        <div className="mt-auto border-t border-slate-800 p-3">
          <div className="flex items-center gap-3 rounded-lg px-2 py-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-700 text-white">
              <IkonOrang className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-white">
                {user.name}
              </p>
              <p className="truncate text-[11px] text-slate-400">
                @{user.username}
              </p>
            </div>
            <form action={keluar}>
              <button
                type="submit"
                title="Keluar"
                className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-800 hover:text-rose-400"
              >
                <IkonKeluar className="h-5 w-5" />
              </button>
            </form>
          </div>
        </div>
      </aside>

      {/* Header untuk layar kecil */}
      <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-slate-200 bg-white px-4 py-3 lg:hidden">
        <button
          type="button"
          onClick={() => setBuka(true)}
          className="rounded-lg p-2 text-slate-700 transition hover:bg-slate-100"
          aria-label="Buka menu"
        >
          <IkonMenu className="h-6 w-6" />
        </button>
        <p className="text-sm font-bold text-slate-900">Kasir Pakaian</p>
        <form action={keluar} className="ml-auto">
          <button
            type="submit"
            className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-rose-600"
            aria-label="Keluar"
          >
            <IkonKeluar className="h-5 w-5" />
          </button>
        </form>
      </header>

      {/* Drawer untuk layar kecil */}
      {buka && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="absolute inset-0 bg-slate-900/60"
            onClick={() => setBuka(false)}
          />
          <aside className="absolute inset-y-0 left-0 flex w-64 flex-col bg-slate-900">
            <div className="flex items-center justify-between">
              <Logo />
              <button
                type="button"
                onClick={() => setBuka(false)}
                className="mr-3 rounded-lg p-2 text-slate-400 hover:bg-slate-800"
                aria-label="Tutup menu"
              >
                <IkonTutup className="h-5 w-5" />
              </button>
            </div>
            <IsiMenu onNavigate={() => setBuka(false)} />
            <div className="mt-auto border-t border-slate-800 p-4">
              <p className="text-sm font-semibold text-white">{user.name}</p>
              <p className="text-[11px] text-slate-400">@{user.username}</p>
            </div>
          </aside>
        </div>
      )}

      <main className="lg:pl-60">
        <div className="mx-auto w-full max-w-6xl px-4 py-5 sm:px-6 lg:px-8">
          {children}
        </div>
      </main>
    </div>
  );
}