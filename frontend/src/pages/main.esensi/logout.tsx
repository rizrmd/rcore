import { betterAuth } from "@/lib/better-auth";
import { useLocal } from "@/lib/hooks/use-local";
import { toast } from "sonner";

export default () => {
  const local = useLocal(
    {
      loading: true as boolean,
    },
    async () => {
      try {
        // Sign out using better-auth
        await betterAuth.signOut();
      } catch (error) {
        toast.error("Terjadi kesalahan", {
          description: "Silakan coba lagi",
        });
      } finally {
        // Redirect to login page regardless of result
        window.location.href = "/login";
      }
    }
  );

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h2 className="text-xl font-semibold mb-2">Keluar dari akun...</h2>
        <p className="text-gray-600">Mohon tunggu sebentar</p>
      </div>
    </div>
  );
};
