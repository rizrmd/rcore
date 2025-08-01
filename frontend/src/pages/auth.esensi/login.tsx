import { AppLoading } from "@/components/app/loading";
import { EForm } from "@/components/core/eform/eform";
import { SideForm } from "@/components/ext/side-form";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert } from "@/components/ui/global-alert";
import { Label } from "@/components/ui/label";
import {
  betterAuth,
  type AuthClientGetSessionAPIResponse,
} from "@/lib/better-auth";
import { baseUrl } from "@/lib/gen/base-url";
import { useLocal } from "@/lib/hooks/use-local";
import { navigate } from "@/lib/router";
import { useEffect } from "react";
import { toast } from "sonner";

const enableRegisterInternal = false;

enum VerifyType {
  OTP = "otp",
  TOTP = "totp",
}

export default () => {
  const u = baseUrl;
  const params = new URLSearchParams(location.search);
  const callbackURL = params.get("callbackURL") as string | undefined;
  const username = params.get("username") as string | undefined;
  const token = params.get("token") as string | undefined;
  const otp = params.get("otp") as string | undefined;

  const local = useLocal(
    {
      code: otp || "",
      trustDevice: false,
      isLoading: false,
      isInit: true,
      isResending: false,
      verifyType: VerifyType.OTP as VerifyType,
    },
    async () => {
      const ses: AuthClientGetSessionAPIResponse =
        await betterAuth.getSession();
      
      if (ses.data?.user) {
        // Check if trying to access internal dashboard when already logged in
        if (isCallbackURLComingFromInternalEsensi()) {
          // Check if user has internal access
          if (!(ses.data.user as any).idInternal) {
            // User is logged in but doesn't have internal access
            // Stay on login page and show them they can logout
            local.isInit = false;
            local.render();
            
            // Check if this is a callback from Google OAuth
            const urlParams = new URLSearchParams(window.location.search);
            if (urlParams.has('code') || urlParams.has('state')) {
              // User just came back from Google OAuth but doesn't have internal access
              setTimeout(() => {
                Alert.info("Login Google berhasil, tetapi Anda tidak memiliki akses ke sistem internal. Hubungi administrator untuk mendapatkan akses.");
              }, 500);
              // Clean up URL parameters
              window.history.replaceState({}, document.title, window.location.pathname + '?callbackURL=' + encodeURIComponent(callbackURL || ''));
            } else {
              setTimeout(() => {
                Alert.info("Anda sudah login, tetapi tidak memiliki akses ke sistem internal. Logout terlebih dahulu jika ingin login dengan akun yang berbeda.");
              }, 500);
            }
            return;
          } else {
            // User has internal access, redirect to dashboard
            if (!callbackURL) window.location.replace(u.main_esensi);
            else window.location.replace(callbackURL);
            return;
          }
        }
        
        if (!callbackURL) window.location.replace(u.main_esensi);
        else window.location.replace(callbackURL);
        return;
      }
      
      local.isInit = false;
      local.render();
    }
  );

  function isCallbackURLComingFromInternalEsensi() {
    return callbackURL?.startsWith(u.internal_esensi);
  }

  // If we have OTP or token parameters, redirect to the appropriate page
  useEffect(() => {
    if (token) {
      navigate(
        `/password-reset?token=${token}&callbackURL=${callbackURL || ""}`
      );
    } else if (otp) {
      handleOtpVerification();
    }
  }, [token, otp]);

  const handleOtpVerification = async () => {
    if (otp && otp.length === 6) {
      local.isLoading = true;
      local.render();

      let result = await betterAuth.twoFactor.verifyOtp({
        code: otp,
        trustDevice: local.trustDevice,
      });

      const { data, error } = result;

      if (error) {
        toast.error(`Verifikasi gagal: ${error.message}`);
      } else if (data?.user) {
        // Check if trying to access internal dashboard
        if (isCallbackURLComingFromInternalEsensi()) {
          if (!(data.user as any).idInternal) {
            toast.error("Akses Ditolak - Anda tidak memiliki akses ke sistem internal. Hubungi administrator untuk mendapatkan akses.");
            local.isLoading = false;
            local.render();
            return;
          }
        }
        
        toast.success("Verifikasi berhasil!");
        const redirectUrl = callbackURL || "/dashboard";
        window.location.replace(redirectUrl);
      }

      local.isLoading = false;
      local.render();
    }
  };


  return (
    <SideForm sideImage={"/img/side-bg.jpg"}>
      {local.isInit ? (
        <AppLoading logo={false} />
      ) : (
        <div className="space-y-6">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-semibold">Login Esensi</h1>
            <p className="text-muted-foreground mt-2">
              Masukkan akun Anda untuk melanjutkan
            </p>
          </div>

          <EForm
            data={{ username: username || "", password: "", loading: false }}
            onSubmit={async ({ write, read }) => {
              if (!read.loading) {
                if (!read.username || !read.password) {
                  Alert.info("Isi semua kolom");
                  return;
                }
                write.loading = true;

                console.log("Logging in with:", read.username, read.password);

                const res = await betterAuth.signIn({
                  username: read.username,
                  password: read.password,
                });

                console.log("SignIn response:", res);

                if (!res.error) {
                  // Check if trying to access internal dashboard
                  if (isCallbackURLComingFromInternalEsensi()) {
                    // Get user session to check internal access
                    const session = await betterAuth.getSession();
                    const user = session.data?.user;
                    
                    if (!(user as any)?.idInternal) {
                      write.loading = false;
                      console.log("Access denied for user:", user);
                      Alert.info("Akses Ditolak - Anda tidak memiliki akses ke sistem internal. Hubungi administrator untuk mendapatkan akses.");
                      return;
                    }
                  }
                  
                  if (!callbackURL) window.location.replace(u.main_esensi);
                  else window.location.replace(callbackURL);
                  return;
                }

                if (res.error) {
                  if (res.error.code === "two-factor-required") {
                    const extendedError = res.error as any;
                    const tfType = extendedError?.metadata?.type as string;
                    local.verifyType = tfType === VerifyType.TOTP ? VerifyType.TOTP : VerifyType.OTP;
                    local.render();

                    // Redirect to verify-otp page (could be implemented as a separate page)
                    navigate(
                      `/verify-otp?callbackURL=${callbackURL || ""}&username=${
                        read.username
                      }`
                    );
                    Alert.info("Verifikasi dua langkah diperlukan");
                  } else if (res.error.code === "email-not-verified") {
                    Alert.info(res.error.message);
                    navigate(
                      "/email-verification?callbackURL=" +
                        callbackURL +
                        "&username=" +
                        read.username
                    );
                  } else {
                    Alert.info(res.error.message);
                  }
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
                    name="username"
                    disabled={read.loading}
                    label="Email"
                  />
                  <Field
                    name="password"
                    disabled={read.loading}
                    label="Password"
                    input={{ type: "password" }}
                  />

                  <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-2">
                      <Checkbox id="remember" />
                      <Label htmlFor="remember" className="text-sm">
                        Ingat saya
                      </Label>
                    </div>
                    <Button
                      type="button"
                      variant="link"
                      className="p-0 text-sm h-auto"
                      onClick={() =>
                        navigate(
                          "/password-reset" +
                            (callbackURL ? `?callbackURL=${callbackURL}` : "")
                        )
                      }
                    >
                      Lupa Password?
                    </Button>
                  </div>

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={read.loading}
                  >
                    {read.loading ? "Sedang Masuk..." : "Masuk"}
                  </Button>
                </>
              );
            }}
          </EForm>

{!isCallbackURLComingFromInternalEsensi() && (
          <>
            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  Atau lanjutkan dengan
                </span>
              </div>
            </div>

            <Button
              variant="outline"
              className="w-full flex items-center justify-center gap-2"
              onClick={async () => {
                try {
                  // Normal Google sign in for non-internal pages
                  const { error } = await betterAuth.social({
                    provider: "google",
                    callbackURL,
                    newUserCallbackURL: callbackURL,
                  });
                  
                  if (error) {
                    toast.error("Gagal masuk dengan Google", {
                      description: error.message,
                    });
                  }
                } catch (err: any) {
                  console.error("Google Sign-In failed:", err);
                  toast.error("Terjadi kesalahan saat masuk dengan Google.");
                }
              }}
              type="button"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 48 48"
                width="18"
                height="18"
              >
                <path
                  fill="#FFC107"
                  d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"
                />
                <path
                  fill="#FF3D00"
                  d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"
                />
                <path
                  fill="#4CAF50"
                  d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"
                />
                <path
                  fill="#1976D2"
                  d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"
                />
              </svg>
              Masuk dengan Google
            </Button>
          </>
          )}
          
          {(!isCallbackURLComingFromInternalEsensi() ||
            (enableRegisterInternal &&
              isCallbackURLComingFromInternalEsensi())) && (
            <div className="text-center text-sm">
              <p className="text-muted-foreground">
                Belum punya akun?{" "}
                <Button
                  variant="link"
                  className="p-0 h-auto"
                  onClick={() =>
                    navigate(
                      "/register" +
                        (callbackURL ? `?callbackURL=${callbackURL}` : "")
                    )
                  }
                >
                  Daftar sekarang
                </Button>
              </p>
            </div>
          )}
        </div>
      )}
    </SideForm>
  );
};
