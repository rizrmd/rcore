import { EForm } from "@/components/core/eform/eform";
import { MyFileUpload } from "@/components/ext/my-file-upload";
import { SideForm } from "@/components/ext/side-form";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/global-alert";
import { betterAuth } from "@/lib/better-auth";
import { baseUrl } from "@/lib/gen/base-url";
import { api } from "@/lib/gen/publish.esensi";
import { useLocal } from "@/lib/hooks/use-local";
import { navigate } from "@/lib/router";
import type { author } from "shared/types";
import type { UploadAPIResponse } from "shared/types";
import { Role } from "shared/types";

export default () => {
  const local = useLocal(
    {
      callbackURL: undefined as string | undefined,
      files: [] as File[],
    },
    async () => {
      const params = new URLSearchParams(location.search);
      local.callbackURL = params.get("callbackURL") as string | undefined;
      if (!local.callbackURL) {
        navigate("/");
      }
      local.render();
    }
  );
  const params = new URLSearchParams(location.search);
  const callbackURL = params.get("callbackURL") as string | undefined;

  function translateErrorMessage(message: string) {
    throw new Error("Function not implemented.");
  }

  return (
    <SideForm sideImage={"/img/side-bg.jpg"}>
      <div className="space-y-1">
        <div className="text-center">
          <h1 className="text-2xl font-semibold">Daftar</h1>
        </div>
        <EForm
          data={{
            name: "",
            email: "",
            password: "",
            password2: "",
            image: "",
            loading: false,
          }}
          onSubmit={async ({ write, read }) => {
            if (!read.loading) {
              if (!read.name || !read.email || !read.password) {
                Alert.info("Isi semua kolom yang wajib");
                return;
              }
              if (read.password !== read.password2) {
                Alert.info("Konfirmasi kata sandi tidak sesuai");
                return;
              }
              if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(read.email)) {
                Alert.info("Email tidak valid");
                return;
              }
              write.loading = true;

              if (local.files.length > 0) {
                const file = local.files[0];
                const formData = new FormData();
                formData.append("file", file);
                const res = await fetch(`${baseUrl.auth_esensi}/api/upload`, {
                  method: "POST",
                  body: formData,
                });
                const uploaded: UploadAPIResponse = await res.json();
                if (uploaded.name) write.image = uploaded.name;
              }

              const res = await betterAuth.signUp({
                name: read.name,
                username: read.email,
                password: read.password,
                image: write.image,
                callbackURL: local.callbackURL,
              });

              if (!res.error) {
                if (res.data) {
                  // Call API to save author profile
                  await api.onboarding({
                    role: Role.AUTHOR,
                    userId: res.data.user.id,
                    data: {
                      name: read.name,
                      biography: "",
                      social_media: "",
                      avatar: write.image,
                    } as author,
                  });
                }

                Alert.info("Pendaftaran berhasil, silahkan cek email anda");
                if (!local.callbackURL)
                  window.location.replace(baseUrl.main_esensi);
                else window.location.replace(local.callbackURL!);
                return;
              }

              // Handle specific error messages in Bahasa Indonesia
              if (res.error) {
                if (res.error.message) {
                  // Map common error messages to user-friendly Bahasa Indonesia messages
                  if (res.error.code === "USER_ALREADY_EXISTS") {
                    Alert.info(
                      "Email ini sudah terdaftar. Silakan gunakan email lain atau coba masuk."
                    );
                  } else if (res.error.code === "PASSWORD_TOO_SHORT") {
                    Alert.info(
                      "Kata sandi tidak memenuhi persyaratan keamanan. Gunakan minimal 8 karakter dengan kombinasi huruf dan angka."
                    );
                  } else {
                    Alert.info(
                      "Terjadi kesalahan saat mendaftar: " +
                        translateErrorMessage(res.error.message)
                    );
                  }
                } else {
                  Alert.info(
                    "Terjadi kesalahan saat mendaftar. Silakan coba lagi."
                  );
                }
              }

              write.loading = false;
            }
          }}
          className="space-y-4 pt-3"
        >
          {({ Field, read }) => {
            return (
              <>
                <Field
                  name="name"
                  disabled={read.loading}
                  label="Nama Lengkap"
                />
                <Field name="email" disabled={read.loading} label="Email" />
                <Field
                  name="password"
                  disabled={read.loading}
                  input={{ type: "password" }}
                  label="Kata Sandi"
                />
                <Field
                  name="password2"
                  disabled={read.loading}
                  input={{ type: "password" }}
                  label="Konfirmasi Kata Sandi"
                />
                <MyFileUpload
                  title="Foto Profil"
                  accept="image/*"
                  onImageChange={(files) => {
                    local.files = files;
                    local.render();
                  }}
                />
                <Button
                  type="submit"
                  className="w-full"
                  disabled={read.loading}
                >
                  {read.loading ? "Mendaftar..." : "Daftar"}
                </Button>
              </>
            );
          }}
        </EForm>
        <div className="text-center text-sm">
          <p className="text-muted-foreground">
            <Button
              variant="link"
              className="p-0 h-auto"
              onClick={() =>
                navigate(
                  "/login" + (callbackURL ? `?callbackURL=${callbackURL}` : "")
                )
              }
            >
              Kembali
            </Button>
          </p>
        </div>
      </div>
    </SideForm>
  );
};
