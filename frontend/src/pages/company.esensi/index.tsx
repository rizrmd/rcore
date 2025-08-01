import { useLocal } from "@/lib/hooks/use-local";

export default function CompanyIndex() {
  const local = useLocal(
    {
      loading: true,
      data: null as any
    },
    async () => {
      local.loading = false;
      local.render();
    }
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8">
        <h1 className="text-4xl font-bold mb-4">Selamat Datang di Company Esensi</h1>
        <p className="text-lg text-muted-foreground">
          Ini adalah halaman utama untuk Company Esensi.
        </p>
        
        <div className="mt-8 p-6 bg-card rounded-lg shadow-sm">
          <h2 className="text-2xl font-semibold mb-3">Tentang Kami</h2>
          <p className="text-muted-foreground">
            Company Esensi adalah platform yang menyediakan layanan profesional untuk bisnis Anda.
          </p>
        </div>
      </div>
    </div>
  );
}