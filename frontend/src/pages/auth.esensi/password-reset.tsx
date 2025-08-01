import { EForm } from "@/components/core/eform/eform";
import { SideForm } from "@/components/ext/side-form";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/global-alert";
import { betterAuth } from "@/lib/better-auth";
import { baseUrl } from "@/lib/gen/base-url";
import { useLocal } from "@/lib/hooks/use-local";
import { navigate } from "@/lib/router";

export default () => {
  const u = baseUrl;
  const params = new URLSearchParams(location.search);
  const token = params.get("token") as string | undefined;
  const callbackURL = params.get("callbackURL") as string | undefined;

  const local = useLocal({
    mode: token ? "reset" : "request",
  });

  return (
    <SideForm sideImage={"/img/side-bg.jpg"}>
      <div className="space-y-6">
        <div className="flex items-center justify-start mb-6">
          <div className="flex h-9 w-9 items-center justify-center">
            <img src="/img/logo.webp" alt="Esensi Online" className="h-8 w-8" />
          </div>
          <span className="ml-2 font-medium">Esensi Online</span>
        </div>

        {local.mode === "request" ? (
          <>
            <div className="text-center">
              <h1 className="text-2xl font-semibold">Reset Password</h1>
              <p className="text-muted-foreground mt-2">
                Masukkan email Anda untuk menerima instruksi reset password
              </p>
            </div>
            <EForm
              data={{ email: "", loading: false }}
              onSubmit={async ({ write, read }) => {
                if (!read.loading) {
                  if (!read.email) {
                    Alert.info("Masukkan email Anda");
                    return;
                  }

                  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(read.email)) {
                    Alert.info("Format email tidak valid");
                    return;
                  }

                  write.loading = true;

                  try {
                    const res = await betterAuth.forgetPassword({
                      email: read.email,
                      redirectTo:
                        window.location.origin + "/auth.esensi/password-reset",
                    });

                    if (res.error) {
                      Alert.info(res.error.message);
                    } else {
                      Alert.info(
                        "Link reset password telah dikirim ke email Anda"
                      );
                    }
                  } catch (error) {
                    Alert.info("Terjadi kesalahan, silakan coba lagi");
                    console.error(error);
                  }

                  write.loading = false;
                }
              }}
              className="space-y-4"
            >
              {({ Field, read }) => {
                return (
                  <>
                    <Field name="email" disabled={read.loading} label="Email" />
                    <Button
                      type="submit"
                      className="w-full"
                      disabled={read.loading}
                    >
                      {read.loading ? "Mengirim..." : "Kirim Link Reset"}
                    </Button>

                    <div className="text-center text-sm">
                      <a
                        href="/auth.esensi/login"
                        className="text-muted-foreground hover:underline"
                      >
                        Kembali ke halaman login
                      </a>
                    </div>
                  </>
                );
              }}
            </EForm>
          </>
        ) : (
          <>
            <div className="text-center">
              <h1 className="text-2xl font-semibold">Reset Password</h1>
              <p className="text-muted-foreground mt-2">
                Masukkan password baru Anda
              </p>
            </div>
            <EForm
              data={{ password: "", confirmPassword: "", loading: false }}
              onSubmit={async ({ write, read }) => {
                if (!read.loading) {
                  if (!read.password || !read.confirmPassword) {
                    Alert.info("Isi semua kolom");
                    return;
                  }

                  if (read.password !== read.confirmPassword) {
                    Alert.info("Password dan konfirmasi password tidak sama");
                    return;
                  }

                  if (read.password.length < 8) {
                    Alert.info("Password minimal 8 karakter");
                    return;
                  }

                  write.loading = true;

                  try {
                    const res = await betterAuth.resetPassword({
                      newPassword: read.password,
                      token: token!,
                    });

                    if (res.error) {
                      Alert.info(res.error.message);
                    } else {
                      Alert.info("Password berhasil diubah");
                      setTimeout(() => {
                        if (!callbackURL)
                          window.location.replace(u.main_esensi);
                        else
                          navigate(
                            "/login?callbackURL=" +
                              encodeURIComponent(callbackURL)
                          );
                      }, 2000);
                    }
                  } catch (error) {
                    Alert.info("Terjadi kesalahan, silakan coba lagi");
                    console.error(error);
                  }

                  write.loading = false;
                }
              }}
              className="space-y-4"
            >
              {({ Field, read }) => {
                return (
                  <>
                    <Field
                      name="password"
                      disabled={read.loading}
                      label="Password Baru"
                      input={{ type: "password" }}
                    />
                    <Field
                      name="confirmPassword"
                      disabled={read.loading}
                      label="Konfirmasi Password"
                      input={{ type: "password" }}
                    />
                    <Button
                      type="submit"
                      className="w-full"
                      disabled={read.loading}
                    >
                      {read.loading ? "Menyimpan..." : "Simpan Password Baru"}
                    </Button>
                  </>
                );
              }}
            </EForm>
          </>
        )}
      </div>
    </SideForm>
  );
};
