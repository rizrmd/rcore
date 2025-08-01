import { EsensiChapterLayout } from "@/components/esensi/chapter/layout/layout";
import { EsensiChapterLogo } from "@/components/esensi/chapter/svg/esensi-chapter-logo";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { betterAuth } from "@/lib/better-auth";
import { Link } from "@/lib/router";
import { useLocal } from "@/lib/hooks/use-local";
import { ArrowLeftToLine, Eye, EyeClosed } from "lucide-react";
import { SVGgoogle } from "@/components/esensi/chapter/svg/early/google-icon";
import { SVGregisterFloat } from "@/components/esensi/chapter/svg/early/register-float";
import { EarlyFooter } from "@/components/esensi/chapter/layout/layout-early-footer";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

export default () => {
  const local = useLocal({
    showPassword: false as boolean,
    showConfirmPassword: false as boolean,
    loading: false as boolean,
  });

  const FormSchema = z.object({
    fullName: z.string().min(1, "Nama lengkap harus diisi"),
    email: z.string().email("Alamat email tidak benar"),
    password: z.string().min(8, "Password setidaknya 8 karakter"),
    confirmPassword: z.string().min(8, "Konfirmasi password setidaknya 8 karakter"),
  }).refine((data) => data.password === data.confirmPassword, {
    message: "Password dan konfirmasi password tidak sama",
    path: ["confirmPassword"],
  });

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      fullName: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  async function onSubmit(data: z.infer<typeof FormSchema>) {
    local.loading = true;
    local.render();

    try {
      const { data: authData, error } = await betterAuth.signUp({
        name: data.fullName,
        username: data.email,
        password: data.password,
      });

      if (error) {
        toast.error("Gagal mendaftar", {
          description: error.message || "Terjadi kesalahan saat mendaftar",
        });
      } else if (authData) {
        toast.success("Berhasil mendaftar!", {
          description: "Mengarahkan ke platform...",
        });
        
        // Wait for session to be established before redirect
        await betterAuth.getSession();
        
        // Add a small delay to ensure session is properly synced
        setTimeout(() => {
          window.location.href = "https://publish.esensi.online/onboarding";
        }, 1000);
      }
    } catch (error) {
      toast.error("Terjadi kesalahan", {
        description: "Silakan coba lagi",
      });
    } finally {
      local.loading = false;
      local.render();
    }
  }

  const handleGoogleSignUp = async () => {
    try {
      local.loading = true;
      local.render();

      const { error } = await betterAuth.social({
        provider: "google",
        callbackURL: "https://publish.esensi.online/onboarding",
        newUserCallbackURL: "https://publish.esensi.online/onboarding",
      });

      if (error) {
        toast.error("Gagal mendaftar dengan Google", {
          description: error.message,
        });
        local.loading = false;
        local.render();
      }
    } catch (err: any) {
      console.error("Google Sign-Up failed:", err);
      toast.error("Terjadi kesalahan saat mendaftar dengan Google.");
      local.loading = false;
      local.render();
    }
  };

  const togglePassword = (field: "password" | "confirmPassword") => {
    if (field === "password") {
      local.showPassword = !local.showPassword;
    } else {
      local.showConfirmPassword = !local.showConfirmPassword;
    }
    local.render();
  };
  return (
    <EsensiChapterLayout
      enableHeader={false}
      enableFooter={false}
      enableProfileDrawer={false}
    >
      <div className="flex flex-col gap-6 items-center w-full min-h-screen text-(--esensi-color)">
        {/* Header with Logo and Button */}
        <nav className="w-full flex justify-center">
          <div className="esensi-container flex justify-start items-center gap-10 h-20">
            <Link href="/penulis-pionir" className="flex gap-2">
              <ArrowLeftToLine /> <span className="font-semibold">Kembali</span>
            </Link>
          </div>
        </nav>

        <header className="esensi-container flex flex-col gap-8 items-center">
          <EsensiChapterLogo className="h-15" />
          <SVGregisterFloat className="w-[80%] lg:w-md h-auto" />
        </header>

        <section className="esensi-container text-center flex flex-col gap-3">
          <h1 className="text-xl font-bold">
            Mulai Bab Baru Anda <br className="lg:hidden" />
            dengan Esensi Chapter
          </h1>
          <p>
            Dunia cerita baru menanti{" "}
            <span className="hidden lg:inline">—</span>{" "}
            <br className="lg:hidden" />
            ditulis oleh Anda, untuk semua orang.
            <br />
            Bergabung lebih awal dan jadilah bagian dari <br className="lg:hidden" />
            pembaca dan penulis pendiri kami.
          </p>
        </section>

        <section className="esensi-container">
          <div className="max-w-md mx-auto flex flex-col gap-6">
            {/* Google Login Button at the top */}
            <Button
              type="button"
              variant="outline"
              className="w-full h-12 flex items-center justify-center gap-3 border-gray-300 text-gray-700 hover:bg-gray-50 bg-white"
              disabled={local.loading}
              onClick={handleGoogleSignUp}
            >
              <SVGgoogle className="w-5 h-5" /> 
              <span className="font-medium">Daftar Dengan Google</span>
            </Button>

            {/* Divider */}
            <div className="relative flex items-center">
              <div className="flex-grow border-t border-gray-300"></div>
              <span className="px-4 text-sm text-gray-500 bg-white">atau</span>
              <div className="flex-grow border-t border-gray-300"></div>
            </div>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
            {/* Full Name */}
            <FormField
              control={form.control}
              name="fullName"
              render={({ field }) => (
                <FormItem>
                  <label htmlFor="fullName" className="text-sm font-medium">
                    Nama Lengkap
                  </label>
                  <FormControl>
                    <Input
                      id="fullName"
                      type="text"
                      className="px-6 py-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Masukkan nama lengkap Anda"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* E-mail */}
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <label htmlFor="email" className="text-sm font-medium">
                    E-mail
                  </label>
                  <FormControl>
                    <Input
                      id="email"
                      type="email"
                      className="px-6 py-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="email_anda@email.com"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Password */}
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <label htmlFor="password" className="text-sm font-medium">
                    Kata Sandi
                  </label>
                  <div className="relative">
                    <FormControl>
                      <Input
                        id="password"
                        type={local.showPassword ? "text" : "password"}
                        className="px-6 py-4 pr-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
                        placeholder="Masukkan kata sandi Anda"
                        {...field}
                      />
                    </FormControl>
                    <Button
                      type="button"
                      variant="ghost"
                      className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                      onClick={() => togglePassword("password")}
                    >
                      {local.showPassword ? (
                        <Eye size={16} />
                      ) : (
                        <EyeClosed size={16} />
                      )}
                    </Button>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Confirmation Password */}
            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <label htmlFor="confirmPassword" className="text-sm font-medium">
                    Konfirmasi Kata Sandi
                  </label>
                  <div className="relative">
                    <FormControl>
                      <Input
                        id="confirmPassword"
                        type={local.showConfirmPassword ? "text" : "password"}
                        className="px-6 py-4 pr-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
                        placeholder="Konfirmasi kata sandi Anda"
                        {...field}
                      />
                    </FormControl>
                    <Button
                      type="button"
                      variant="ghost"
                      className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                      onClick={() => togglePassword("confirmPassword")}
                    >
                      {local.showConfirmPassword ? (
                        <Eye size={16} />
                      ) : (
                        <EyeClosed size={16} />
                      )}
                    </Button>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Checkboxes */}
            <div className="flex flex-col gap-3 mt-4">
              <div className="flex items-center gap-2">
                <input
                  id="terms"
                  type="checkbox"
                  className="w-6 h-6 accent-[var(--esensi-color-alt)] border-2 border-[var(--esensi-color-alt)] rounded"
                />
                <label htmlFor="terms" className="text-xs text-gray-500">
                  Saya sudah membaca syarat & ketentuan yang berlaku
                </label>
              </div>

              <div className="flex items-center gap-2">
                <input
                  id="notifications"
                  type="checkbox"
                  className="w-6 h-6 accent-[var(--esensi-color-alt)] border-2 border-[var(--esensi-color-alt)] rounded"
                />
                <label
                  htmlFor="notifications"
                  className="text-xs text-gray-500"
                >
                  Kirimi saya kabar saat platform ini resmi diluncurkan
                </label>
              </div>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full py-4 px-6 h-12 mt-6 bg-(--esensi-color-alt) hover:bg-(--esensi-color) text-(--esensi-color-i) rounded-lg"
              disabled={local.loading}
            >
              {local.loading ? "Memproses..." : "Daftar Sekarang"}
            </Button>
              </form>
            </Form>
          </div>
        </section>
        <EarlyFooter />
      </div>
    </EsensiChapterLayout>
  );
};
