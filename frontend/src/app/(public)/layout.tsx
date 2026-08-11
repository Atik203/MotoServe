import { PublicFooter } from "@/components/layout/PublicFooter";
import { PublicNavbar } from "@/components/layout/PublicNavbar";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-[#f8f9fa]">
      <PublicNavbar />
      <main className="flex-1 pt-[65px]">{children}</main>
      <PublicFooter />
    </div>
  );
}
