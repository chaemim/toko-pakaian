import { wajibLogin } from "@/lib/auth";
import AppShell from "@/components/AppShell";

export default async function Layout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const user = await wajibLogin();

  return (
    <AppShell user={{ name: user.name, username: user.username }}>
      {children}
    </AppShell>
  );
}