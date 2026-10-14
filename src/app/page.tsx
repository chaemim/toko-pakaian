import { redirect } from "next/navigation";
import { ambilPengguna } from "@/lib/auth";

export default async function Beranda() {
  const user = await ambilPengguna();
  redirect(user ? "/dashboard" : "/login");
}