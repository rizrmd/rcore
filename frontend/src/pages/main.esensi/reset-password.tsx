import { MainEsensiLayout } from "@/components/esensi/layout/layout";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { betterAuth } from "@/lib/better-auth";
import { useLocal } from "@/lib/hooks/use-local";
import { Link, navigate } from "@/lib/router";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeClosed } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

export default () => {
  const header_config = {
    enable: true,
    logo: false,
    back: true,
    search: false,
    title: "Reset Kata Sandi",
    profile: false,
    desktopHide: true,
  };
  const footer_config = {
    desktopHide: true,
  };

  const local = useLocal(
    {
      loading: false as boolean,
      showPassword: false as boolean,
      showConfirmPassword: false as boolean,
      token: "" as string,
    },
    async () => {
      // Get token from URL parameters
      const urlParams = new URLSearchParams(window.location.search);
      local.token = urlParams.get("token") || "";
      local.loading = false;
      local.render();
    }
  );

  const logo = `<svg viewBox="0 0 55 63" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M21.4035 11.7311C26.1143 12.4694 30.5888 10.1295 32.7601 6.22607L5.95181 13.5606C-1.59539 37.6816 -0.660926 51.4766 8.53534 58.6266C11.8719 61.2054 15.5219 62.4106 19.4851 62.5355C26.8619 62.7635 35.2172 59.1641 43.9077 53.6102C22.1071 62.4269 24.2124 38.0019 24.2124 38.0019C24.5807 33.3058 26.4167 26.0201 29.33 17.2849C27.7579 14.4238 24.9105 12.2848 21.4035 11.7365V11.7311Z" /><path d="M48.1519 16.0692C67.3359 -7.99208 34.0139 2.1004 34.0139 2.1004L33.838 3.4305C33.893 3.19162 33.9534 2.95817 33.9919 2.7193C33.041 8.64232 37.1251 14.207 43.1222 15.1462C38.2025 14.3753 33.5302 16.9595 31.4853 21.1833L28.9678 40.1358L48.1519 16.0746V16.0692Z" /></svg>`;

  const FormSchema = z
    .object({
      password: z.string().min(8, "Password setidaknya 8 karakter"),
      confirmPassword: z.string().min(8, "Password setidaknya 8 karakter"),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: "Konfirmasi password tidak sesuai",
      path: ["confirmPassword"],
    });

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  async function onSubmit(data: z.infer<typeof FormSchema>) {
    if (!local.token) {
      toast.error("Token tidak valid", {
        description: "Link reset password tidak valid atau sudah kedaluwarsa",
      });
      return;
    }

    local.loading = true;
    local.render();

    try {
      const { data: resetData, error } = await betterAuth.resetPassword({
        newPassword: data.password,
        token: local.token,
      });

      if (error) {
        toast.error("Gagal reset password", {
          description:
            error.message || "Token tidak valid atau sudah kedaluwarsa",
        });
      } else {
        toast.success("Password berhasil direset", {
          description: "Anda akan dialihkan ke halaman login",
        });
        // Redirect to login after successful reset
        setTimeout(() => {
          navigate("/login");
        }, 2000);
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

  const togglePassword = (field: "password" | "confirmPassword") => {
    if (field === "password") {
      local.showPassword = !local.showPassword;
    } else {
      local.showConfirmPassword = !local.showConfirmPassword;
    }
    local.render();
  };

  if (!local.token) {
    return (
      <MainEsensiLayout
        header_config={header_config}
        footer_config={footer_config}
        mobile_menu={true}
      >
        <div className="flex justify-center w-full lg:min-h-screen">
          <div className="flex flex-col flex-1 justify-start items-center lg:justify-center gap-6 w-full p-6 lg:p-8 max-w-[1200px]">
            <div className="flex w-full lg:max-w-88 flex-col items-center gap-6 text-[#3B2C93]">
              <div
                className="w-1/4 [&>svg]:h-auto [&>svg]:w-full"
                dangerouslySetInnerHTML={{ __html: logo }}
              ></div>
              <div className="text-center">
                <h2 className="text-3xl font-semibold mb-2 text-red-600">
                  Link Tidak Valid
                </h2>
                <p className="text-gray-600 mb-4">
                  Link reset password tidak valid atau sudah kedaluwarsa
                </p>
                <Link href="/forgot" className="text-[#3B2C93] font-bold">
                  Minta link reset password baru
                </Link>
              </div>
            </div>
          </div>
        </div>
      </MainEsensiLayout>
    );
  }

  const renderForm = (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex flex-col w-full lg:max-w-88 gap-7"
      >
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem className="relative">
              <FormControl>
                <Input
                  type={local.showPassword ? "text" : "password"}
                  className="pr-10"
                  placeholder="Kata sandi baru"
                  {...field}
                />
              </FormControl>
              <Button
                type="button"
                variant="ghost"
                className="absolute right-0 top-0.5 p-0 hover:bg-transparent"
                onClick={() => togglePassword("password")}
              >
                {local.showPassword ? <Eye /> : <EyeClosed />}
              </Button>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="confirmPassword"
          render={({ field }) => (
            <FormItem className="relative">
              <FormControl>
                <Input
                  type={local.showConfirmPassword ? "text" : "password"}
                  className="pr-10"
                  placeholder="Konfirmasi kata sandi baru"
                  {...field}
                />
              </FormControl>
              <Button
                type="button"
                variant="ghost"
                className="absolute right-0 top-0.5 p-0 hover:bg-transparent"
                onClick={() => togglePassword("confirmPassword")}
              >
                {local.showConfirmPassword ? <Eye /> : <EyeClosed />}
              </Button>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button
          type="submit"
          className="bg-[#3B2C93] text-white h-10 rounded-xl border-0"
          disabled={local.loading}
        >
          {local.loading ? "Memproses..." : "Reset Password"}
        </Button>
        <FormDescription className="text-center -mt-3 font-semibold">
          Ingat kata sandi?
          <Link href="/login" className="text-[#3B2C93] ml-2">
            Masuk sekarang
          </Link>
        </FormDescription>
      </form>
    </Form>
  );

  const renderHeader = (
    <div className="flex w-full lg:max-w-88 flex-col items-center gap-6 text-[#3B2C93]">
      <div
        className="w-1/4 [&>svg]:h-auto [&>svg]:w-full"
        dangerouslySetInnerHTML={{ __html: logo }}
      ></div>
      <div className="text-center">
        <h2 className="text-3xl font-semibold mb-2">Reset Kata Sandi</h2>
        <p className="text-gray-600">
          Masukkan kata sandi baru untuk akun Anda
        </p>
      </div>
    </div>
  );

  return (
    <MainEsensiLayout
      header_config={header_config}
      footer_config={footer_config}
      mobile_menu={true}
    >
      <div className="flex justify-center w-full lg:min-h-screen">
        <div className="flex flex-col flex-1 justify-start items-center lg:justify-center gap-6 w-full p-6 lg:p-8 max-w-[1200px] [&_label]:text-[#3B2C93] [&_label]:font-bold [&_input]:rounded-xl [&_input]:h-10">
          {renderHeader}
          {renderForm}
        </div>
      </div>
    </MainEsensiLayout>
  );
};
