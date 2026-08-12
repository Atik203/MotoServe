import { PublicFooter } from "@/components/layout/PublicFooter";
import { PublicNavbar } from "@/components/layout/PublicNavbar";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-[#f8f9fa]">
      <PublicNavbar fixed={false} />
      <main className="flex-1">{children}</main>
      <PublicFooter />
    </div>
  );
}
