import { Sidebar } from "@/components/layout/Sidebar";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 lg:ml-60 px-4 sm:px-6 lg:px-8 pt-[72px] lg:pt-8 pb-24 lg:pb-8">
        {children}
      </main>
    </div>
  );
}
