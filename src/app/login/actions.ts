"use server";

import { redirect } from "next/navigation";
import { buatSesi, cekLogin, hapusSesi } from "@/lib/auth";

export type StatusLogin = { ok: boolean; message: string };

export async function masuk(
  _prev: StatusLogin | null,
  formData: FormData,
): Promise<StatusLogin> {
  const hasil = await cekLogin(
    String(formData.get("username") ?? ""),
    String(formData.get("password") ?? ""),
  );

  if (!hasil.ok) return { ok: false, message: hasil.message };

  await buatSesi(hasil.user.id);
  redirect("/dashboard");
}

export async function keluar(): Promise<void> {
  await hapusSesi();
  redirect("/login");
}