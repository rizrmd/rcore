import { MainEsensiLayout } from "@/components/esensi/layout/layout";
import { LoginBanner } from "@/components/esensi/ui/login-banner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { betterAuth } from "@/lib/better-auth";
import { useLocal } from "@/lib/hooks/use-local";
import { Link, navigate } from "@/lib/router";
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
    title: "Daftar Akun",
    profile: false,
    desktopHide: true,
  };

  const footer_config = {
    desktopHide: true,
  };

  const local = useLocal(
    {
      loading: false as boolean,
      toggle: {
        password: false as boolean,
        password2: false as boolean,
      } as any,
    },
    async () => {
      local.loading = false;
      local.render();
    }
  );

  const googleIcon = `<svg width="16" height="16" viewBox="0 0 255.87800000000001 261.1" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid"><path d="M255.878 133.451c0-10.734-.871-18.567-2.756-26.69H130.55v48.448h71.947c-1.45 12.04-9.283 30.172-26.69 42.356l-.244 1.622 38.755 30.023 2.685.268c24.659-22.774 38.875-56.282 38.875-96.027" fill="#4285F4"/><path d="M130.55 261.1c35.248 0 64.839-11.605 86.453-31.622l-41.196-31.913c-11.024 7.688-25.82 13.055-45.257 13.055-34.523 0-63.824-22.773-74.269-54.25l-1.531.13-40.298 31.187-.527 1.465C35.393 231.798 79.49 261.1 130.55 261.1" fill="#34A853"/><path d="M56.281 156.37c-2.756-8.123-4.351-16.827-4.351-25.82 0-8.994 1.595-17.697 4.206-25.82l-.073-1.73L15.26 71.312l-1.335.635C5.077 89.644 0 109.517 0 130.55s5.077 40.905 13.925 58.602l42.356-32.782" fill="#FBBC05"/><path d="M130.55 50.479c24.514 0 41.05 10.589 50.479 19.438l36.844-35.974C195.245 12.91 165.798 0 130.55 0 79.49 0 35.393 29.301 13.925 71.947l42.211 32.783c10.59-31.477 39.891-54.251 74.414-54.251" fill="#EB4335"/></svg>`;
  const googleLogin = (e: any) => {
    e.preventDefault();
  };

  const FormSchema = z
    .object({
      fullname: z.string().min(2, {
        message: "Nama lengkap minimal 2 karakter",
      }),
      email: z.string().email("Alamat email tidak benar"),
      password: z.string().min(8, "Password setidaknya 8 karakter"),
      password2: z.string().min(8, "Password setidaknya 8 karakter"),
      terms_agree: z.boolean().refine((val) => val, {
        message: "Anda harus menyetujui syarat dan ketentuan",
      }),
    })
    .refine((data) => data.password === data.password2, {
      message: "Konfirmasi password tidak sesuai",
      path: ["password2"],
    });

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      fullname: "",
      email: "",
      password: "",
      password2: "",
      terms_agree: false,
    },
  });

  async function onSubmit(data: z.infer<typeof FormSchema>) {
    local.loading = true;
    local.render();

    try {
      const { data: authData, error } = await betterAuth.signUp({
        username: data.email,
        password: data.password,
        name: data.fullname,
      });

      if (error) {
        toast.error("Gagal mendaftar", {
          description: error.message || "Terjadi kesalahan saat mendaftar",
        });
      } else if (authData) {
        toast.success("Berhasil mendaftar akun", {
          description: "Anda akan dialihkan ke halaman login",
        });
        // Redirect to main.esensi login page
        window.location.href = getMainEsensiURL() + '/login';
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

  const handleTogglePass = (field: "password" | "password2") => {
    local.toggle[field] = !local.toggle[field];
    local.render();
  };

  const renderLoading = <></>;
  const renderRegisterForm = (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex flex-col w-full lg:max-w-88 gap-7"
      >
        <FormField
          control={form.control}
          name="fullname"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Input placeholder="Nama lengkap" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
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
                onClick={() => handleTogglePass("password")}
              >
                {local.toggle.password ? <Eye /> : <EyeClosed />}
              </Button>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password2"
          render={({ field }) => (
            <FormItem className="relative -mt-4">
              <FormControl>
                <Input
                  type={local.toggle.password2 ? "text" : "password"}
                  className="pr-10"
                  placeholder="Konfirmasi kata sandi"
                  {...field}
                />
              </FormControl>
              <Button
                type="button"
                variant="ghost"
                className="absolute right-0 top-0.5 p-0 hover:bg-transparent"
                onClick={() => handleTogglePass("password2")}
              >
                {local.toggle.password2 ? <Eye /> : <EyeClosed />}
              </Button>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="terms_agree"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel className="text-sm font-normal">
                  Saya menyetujui{" "}
                  <Link href="/terms" className="text-[#3B2C93] font-bold">
                    syarat dan ketentuan
                  </Link>{" "}
                  yang berlaku
                </FormLabel>
                <FormMessage />
              </div>
            </FormItem>
          )}
        />
        <Button
          type="submit"
          className="bg-[#3B2C93] text-white h-10 rounded-xl border-0"
          disabled={local.loading}
        >
          {local.loading ? "Memproses..." : "Daftar akun"}
        </Button>
        <Button
          type="button"
          className="flex justify-center items-center -mt-4 gap-1.5 bg-white text-black hover:bg-[#eee] border border-black h-10 rounded-xl"
          disabled={local.loading}
          onClick={googleLogin}
        >
          <span dangerouslySetInnerHTML={{ __html: googleIcon }}></span>
          <span>Daftar menggunakan akun Google</span>
        </Button>
        <FormDescription className="text-center -mt-3 font-semibold">
          Sudah punya akun?
          <Link href="/login" className="text-[#3B2C93] ml-2">
            Masuk sekarang
          </Link>
        </FormDescription>
      </form>
    </Form>
  );

  const renderRegisterHeader = (
    <div className="flex w-full lg:max-w-88 flex-col items-center gap-6 text-[#3B2C93]">
      <h2 className="whitespace-pre-line text-3xl text-center font-semibold">
        Daftar di Esensi online
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
        <div className="flex flex-1 flex-col justify-start items-center lg:justify-center gap-6 w-full p-6 lg:p-8 max-w-[1200px] [&_label]:text-[#3B2C93] [&_label]:font-bold [&_input]:rounded-xl [&_input]:h-10">
          {local.loading ? renderLoading : renderRegisterHeader}
          {local.loading ? renderLoading : renderRegisterForm}
        </div>
      </div>
    </MainEsensiLayout>
  );
};
