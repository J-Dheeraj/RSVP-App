import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import AdminNav from "@/components/AdminNav";
import SessionProvider from "@/components/SessionProvider";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/admin/login");

  return (
    <SessionProvider session={session}>
      <div className="min-h-screen bg-stone-50">
        <AdminNav />
        <main className="max-w-7xl mx-auto px-4 py-8">{children}</main>
      </div>
    </SessionProvider>
  );
}
