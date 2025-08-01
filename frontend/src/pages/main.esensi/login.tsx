import { MainEsensiLayout } from "@/components/esensi/layout/layout";
import { LoginBanner } from "@/components/esensi/ui/login-banner";
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
import { Link } from "@/lib/router";
import { getMainEsensiURL } from "@/lib/utils";
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
    title: "Masuk Akun",
    profile: false,
    desktopHide: true,
  };
  const footer_config = {
    desktopHide: true,
  };

  const local = useLocal(
    {
      loading: false as boolean,
      redirectURL: "" as string,
      toggle: {
        password: false as boolean,
      } as any,
    },
    async () => {
      // Get redirectURL from query parameters
      const urlParams = new URLSearchParams(window.location.search);
      local.redirectURL = urlParams.get("redirectURL") || "";
      local.loading = false;
      local.render();
    }
  );

  const logo = `<svg viewBox="0 0 55 63" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M21.4035 11.7311C26.1143 12.4694 30.5888 10.1295 32.7601 6.22607L5.95181 13.5606C-1.59539 37.6816 -0.660926 51.4766 8.53534 58.6266C11.8719 61.2054 15.5219 62.4106 19.4851 62.5355C26.8619 62.7635 35.2172 59.1641 43.9077 53.6102C22.1071 62.4269 24.2124 38.0019 24.2124 38.0019C24.5807 33.3058 26.4167 26.0201 29.33 17.2849C27.7579 14.4238 24.9105 12.2848 21.4035 11.7365V11.7311Z" /><path d="M48.1519 16.0692C67.3359 -7.99208 34.0139 2.1004 34.0139 2.1004L33.838 3.4305C33.893 3.19162 33.9534 2.95817 33.9919 2.7193C33.041 8.64232 37.1251 14.207 43.1222 15.1462C38.2025 14.3753 33.5302 16.9595 31.4853 21.1833L28.9678 40.1358L48.1519 16.0746V16.0692Z" /></svg>`;

  const googleIcon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="18" height="18">
    <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"/>
    <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"/>
    <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"/>
    <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"/>
  </svg>`;

  const handleGoogleSignIn = async () => {
    try {
      local.loading = true;
      local.render();

      const callbackURL = local.redirectURL || getMainEsensiURL();
      const { error } = await betterAuth.social({
        provider: "google",
        callbackURL: callbackURL,
        newUserCallbackURL: callbackURL,
      });

      if (error) {
        toast.error("Gagal masuk dengan Google", {
          description: error.message,
        });
        local.loading = false;
        local.render();
      }
      // Redirect or further actions are handled by better-auth
    } catch (err: any) {
      console.error("Google Sign-In failed:", err);
      toast.error("Terjadi kesalahan saat masuk dengan Google.");
      local.loading = false;
      local.render();
    }
  };

  const FormSchema = z.object({
    email: z.string().email("Alamat email tidak benar"),
    password: z.string().min(8, "Password setidaknya 8 karakter"),
  });

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  async function onSubmit(data: z.infer<typeof FormSchema>) {
    local.loading = true;
    local.render();

    try {
      const { data: authData, error } = await betterAuth.signIn({
        username: data.email,
        password: data.password,
        rememberMe: true,
      });

      if (error) {
        toast.error("Gagal masuk", {
          description: error.message || "Email atau kata sandi salah",
        });
      } else if (authData) {
        toast.success("Berhasil masuk ke akun");
        // Redirect to specified URL or main.esensi domain by default
        const redirectTo = local.redirectURL || getMainEsensiURL();
        window.location.href = redirectTo;
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

  const handleTogglePass = (e: any) => {
    local.toggle.password = !local.toggle.password;
    local.render();
  };

  const renderLoading = <></>;
  const renderLoginForm = (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex flex-col w-full lg:max-w-88 gap-7"
      >
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Input placeholder="Email" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem className="relative">
              <FormControl>
                <Input
                  type={local.toggle.password ? "text" : "password"}
                  className="pr-10"
                  placeholder="Kata sandi"
                  {...field}
                />
              </FormControl>
              <Button
                type="button"
                variant="ghost"
                className="absolute right-0 top-0.5 p-0 hover:bg-transparent"
                onClick={handleTogglePass}
              >
                {local.toggle.password ? <Eye /> : <EyeClosed />}
              </Button>
              <FormDescription>
                <Link
                  href="/forgot"
                  className="text-xs text-[#3B2C93] font-bold"
                >
                  Lupa kata sandi?
                </Link>
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button
          type="submit"
          className="bg-[#3B2C93] text-white h-10 rounded-xl border-0"
          disabled={local.loading}
        >
          {local.loading ? "Memproses..." : "Masuk ke akun"}
        </Button>

        <div className="relative -mt-4">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white px-2 text-muted-foreground">
              Atau lanjutkan dengan
            </span>
          </div>
        </div>

        <Button
          type="button"
          className="flex justify-center items-center -mt-4 gap-1.5 bg-white text-black hover:bg-[#eee] border border-black h-10 rounded-xl"
          disabled={local.loading}
          onClick={handleGoogleSignIn}
        >
          <span dangerouslySetInnerHTML={{ __html: googleIcon }}></span>
          <span>Masuk menggunakan akun Google</span>
        </Button>
        <FormDescription className="text-center -mt-3 font-semibold">
          Belum punya akun?
          <Link href="/register" className="text-[#3B2C93] ml-2">
            Daftar sekarang
          </Link>
        </FormDescription>
      </form>
    </Form>
  );

  const renderLoginHeader = (
    <div className="flex w-full lg:max-w-88 flex-col items-center gap-6 text-[#3B2C93]">
      <div
        className="w-1/4 [&>svg]:h-auto [&>svg]:w-full"
        dangerouslySetInnerHTML={{ __html: logo }}
      ></div>
      <h2 className="whitespace-pre-line w-auto text-3xl text-center font-semibold">
        Selamat Datang
        <br />
        di Esensi online
      </h2>
    </div>
  );

  const renderLoginBanner = <LoginBanner></LoginBanner>;

  return (
    <MainEsensiLayout
      header_config={header_config}
      footer_config={footer_config}
      mobile_menu={true}
    >
      <div className="flex justify-center w-full lg:min-h-screen">
        <div className="hidden lg:flex flex-col flex-1">
          {local.loading ? renderLoading : renderLoginBanner}
        </div>
        <div className="flex flex-col flex-1 justify-start items-center lg:justify-center gap-6 w-full p-6 lg:p-8 max-w-[1200px] [&_label]:text-[#3B2C93] [&_label]:font-bold [&_input]:rounded-xl [&_input]:h-10">
          {local.loading ? renderLoading : renderLoginHeader}
          {local.loading ? renderLoading : renderLoginForm}
        </div>
      </div>
    </MainEsensiLayout>
  );
};
