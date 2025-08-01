import { EForm } from "@/components/core/eform/eform";
import { Error } from "@/components/ext/error";
import { Layout } from "@/components/ext/layout/publish.esensi";
import { MenuBarPublish } from "@/components/ext/menu-bar/publish";
import { Success } from "@/components/ext/success";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { betterAuth } from "@/lib/better-auth";
import { api as authApi } from "@/lib/gen/auth.esensi";
import { baseUrl } from "@/lib/gen/base-url";
import { api } from "@/lib/gen/internal.esensi";
import { useLocal } from "@/lib/hooks/use-local";
import { navigate } from "@/lib/router";
import { getMimeType, validateBatch } from "@/lib/utils";
import { Label } from "@radix-ui/react-label";
import type { author } from "shared/types";
import type { UploadAPIResponse } from "shared/types";
import type { User } from "shared/types";
import { type Author } from "shared/types";

export const current = {
  user: undefined as User | undefined,
  author: undefined as Author | undefined,
  formData: null as
    | (author & {
        email: string;
        username: string;
        bank_account_number: string;
        bank_account_provider: string;
        bank_account_holder: string;
        phone: string;
      })
    | null,
};

export default () => {
  const local = useLocal(
    {
      loading: true,
      error: "",
      success: "",
      isSubmitting: false,
      files: {
        old: [] as File[],
        new: [] as File[],
      },
    },
    async () => {
      const res = await betterAuth.getSession();
      current.user = res.data?.user;
      if (!current.user) return;
      await loadData();
    }
  );

  async function loadData() {
    const res = await api.author_get({
      id: current.user?.idAuthor!,
    });
    if (res.success && res.data) current.author = res.data;
    else {
      local.error = res.message || "Gagal memuat data penulis.";
      console.error("Error loading author data:", local.error);
      local.render();
      return;
    }

    current.formData = {
      name: current.user?.name || "",
      email: current.user?.email || "",
      username: current.user?.username || "",
      biography: current.author?.biography || "",
      social_media: current.author?.social_media || "",
      avatar: current.author?.avatar || "",
      bank_account_number: current.author?.bank_account_number || "",
      bank_account_provider: current.author?.bank_account_provider || "",
      bank_account_holder: current.author?.bank_account_holder || "",
      phone: current.author?.phone || "",
    };

    if (current.user?.image) {
      try {
        const imageUrl = current.user.image.startsWith("http")
          ? current.user.image
          : `${baseUrl.auth_esensi}/${current.user.image}`;
        const response = await fetch(imageUrl);
        const blob = await response.blob();

        const fileName = current.user.image.split("/").pop() || "profile.jpg";
        const extension = fileName.split(".").pop()?.toLowerCase();
        const mimeType = getMimeType(extension);

        const file = new File([blob], fileName, {
          type: mimeType,
          lastModified: new Date().getTime(),
        });
        local.files.old = [file];
        local.files.new = [file];
      } catch (error) {
        console.error("Error fetching profile image:", error);
      } finally {
        local.loading = false;
        local.render();
      }
    } else {
      local.loading = false;
      local.render();
    }
  }

  return (
    <Layout loading={local.loading}>
      <MenuBarPublish />
      <main className="flex-1">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
          <Error msg={local.error} />
          <Success msg={local.success} />
          <Card className="shadow-md border border-gray-200">
            <CardHeader>
              <CardTitle className="text-2xl font-bold">
                Perbarui Profil
              </CardTitle>
              <CardDescription>
                Silahkan edit formulir di bawah untuk memperbarui profil Anda.
              </CardDescription>
            </CardHeader>
            <EForm
              data={{
                name: current.formData?.name || "",
                email: current.formData?.email || "",
                username: current.formData?.username || "",
                biography: current.formData?.biography || "",
                social_media: current.formData?.social_media || "",
                bank_account_number:
                  current.formData?.bank_account_number || "",
                bank_account_provider:
                  current.formData?.bank_account_provider || "",
                bank_account_holder:
                  current.formData?.bank_account_holder || "",
                phone:
                  current.formData?.phone || "",
                password: "",
                confirmPassword: "",
              }}
              onSubmit={async ({ read }) => {
                if (
                  validateBatch(local, [
                    {
                      failCondition: !read.name,
                      message: "Nama lengkap tidak boleh kosong.",
                    },
                    {
                      failCondition: !read.email,
                      message: "Email tidak boleh kosong.",
                    },
                  ])
                ) {
                  return;
                }

                if (read.password && read.password !== read.confirmPassword) {
                  local.error = "Password dan konfirmasi password tidak cocok.";
                  local.render();
                  return;
                }

                if (read.password) {
                  try {
                    const res = await authApi.account_update({
                      id_user: current.user?.id!,
                      password: read.password,
                    });

                    if (!res.success) {
                      local.error =
                        res.message || "Gagal memperbarui password.";
                      local.render();
                      return;
                    }
                  } catch (err) {
                    local.error = "Terjadi kesalahan saat menghubungi server.";
                    console.error(err);
                    local.render();
                    return;
                  }
                }

                local.isSubmitting = true;
                local.error = "";
                local.success = "";
                local.render();

                try {
                  if (!current.user?.id) {
                    local.error = "ID pengguna tidak ditemukan";
                    local.isSubmitting = false;
                    local.render();
                    return;
                  }

                  if (local.files.new.length > 0) {
                    const file = local.files.new[0];
                    const formData = new FormData();
                    formData.append("file", file);
                    const res = await fetch(
                      `${baseUrl.auth_esensi}/api/upload`,
                      {
                        method: "POST",
                        body: formData,
                      }
                    );
                    const uploaded: UploadAPIResponse = await res.json();
                    if (uploaded.name) current.user.image = uploaded.name;
                  }

                  const res = await authApi.user_update({
                    id: current.user.id,
                    data: {
                      ...current.user,
                      name: read.name,
                      email: read.email,
                      username: read.username,
                      image: current.user.image,
                    },
                  });

                  if (res.success && res.data) {
                    await api.author_update({
                      id: current.user.idAuthor!,
                      name: read.name,
                      biography: read.biography,
                      social_media: read.social_media,
                      avatar: current.user.image,
                      bank_account_number: read.bank_account_number,
                      bank_account_provider: read.bank_account_provider,
                      bank_account_holder: read.bank_account_holder,
                      phone: read.phone
                    });

                    local.success = "Profil berhasil diperbarui!";
                    setTimeout(() => {
                      local.success = "";
                      local.render();
                    }, 3000);
                  } else
                    local.error = res.message || "Gagal memperbarui profil.";
                } catch (err) {
                  local.error = "Terjadi kesalahan saat menghubungi server.";
                  console.error(err);
                } finally {
                  local.isSubmitting = false;
                  local.render();
                }
              }}
            >
              {({ Field }) => {
                return (
                  <>
                    <CardContent className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Field
                          name="name"
                          disabled={local.loading}
                          input={{ placeholder: "Nama lengkap Anda" }}
                          label="Nama Lengkap"
                        />
                        <Field
                          name="email"
                          disabled={true}
                          input={{ placeholder: "Email Anda" }}
                          label="Email"
                        />
                      </div>
                      <Field
                        name="username"
                        disabled={local.loading}
                        input={{ placeholder: "Username Anda" }}
                        label="Username"
                        optional
                      />
                      <Field
                        name="biography"
                        type="textarea"
                        disabled={local.loading}
                        input={{
                          placeholder: "Ceritakan tentang diri Anda",
                          rows: 4,
                        }}
                        label="Biografi"
                        optional
                      />
                      <Field
                        name="password"
                        type="password"
                        disabled={local.loading}
                        input={{ placeholder: "Kata sandi" }}
                        label="Kata Sandi"
                        optional
                      />
                      <Field
                        name="confirmPassword"
                        type="password"
                        disabled={local.loading}
                        input={{ placeholder: "Konfirmasi kata sandi" }}
                        label="Konfirmasi Kata Sandi"
                        optional
                      />
                      <p className="text-xs text-gray-500 -mt-5">
                        Isi kata sandi hanya jika ingin mengubah password akun
                        Anda. Minimal 8 karakter.
                      </p>
                      <p className="text-xs text-gray-500 -mt-5">
                        Tulis biografi singkat tentang diri Anda sebagai
                        penulis.
                      </p>
                    <Field
                        name="phone"
                        disabled={local.loading}
                        input={{
                          placeholder:
                            "Nomor Telephone"
                        }}
                        label="Nomor Telephone"
                      />
                      <Field
                        name="social_media"
                        disabled={local.loading}
                        input={{
                          placeholder:
                            "Tautan media sosial (Instagram, Twitter, dll)",
                        }}
                        label="Media Sosial"
                        optional
                      />
                      <p className="text-xs text-gray-500 -mt-5">
                        Masukkan alamat media sosial utama Anda. Contoh:
                        https://instagram.com/username
                      </p>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Field
                          name="bank_account_number"
                          disabled={local.loading}
                          input={{
                            placeholder: "Nomor rekening bank",
                          }}
                          label="Nomor Rekening Bank"
                          optional
                        />
                        <Field
                          name="bank_account_provider"
                          disabled={local.loading}
                          input={{
                            placeholder: "Nama bank (contoh: BCA, Mandiri)",
                          }}
                          label="Nama Bank"
                          optional
                        />
                        <Field
                          name="bank_account_holder"
                          disabled={local.loading}
                          input={{
                            placeholder: "Nama pemilik rekening bank",
                          }}
                          label="Nama Pemilik Rekening Bank"
                          optional
                        />
                      </div>
                      <p className="text-xs text-gray-500 -mt-5">
                        Informasi rekening bank untuk keperluan pencairan
                        royalti buku.
                      </p>
                      <div>
                        <Label className="text-sm">Foto Profil</Label>
                        <div className="mt-2 flex items-center gap-4">
                          {current.formData?.avatar ||
                          local.files.new.length > 0 ? (
                            <div className="relative w-20 h-20 rounded-full overflow-hidden border bg-gray-100">
                              <img
                                src={
                                  local.files.new.length > 0
                                    ? URL.createObjectURL(local.files.new[0])
                                    : `${baseUrl.auth_esensi}/${current.formData?.avatar}`
                                }
                                alt="Foto Profil"
                                className="w-full h-full object-cover"
                              />
                            </div>
                          ) : (
                            <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center">
                              <span className="text-gray-500 text-xs">
                                Tidak ada foto
                              </span>
                            </div>
                          )}
                          <div>
                            <Input
                              id="profile-image"
                              type="file"
                              accept="image/*"
                              onChange={(e) => {
                                if (
                                  e.target.files &&
                                  e.target.files.length > 0
                                ) {
                                  local.files.new = [e.target.files[0]];
                                  local.render();
                                }
                              }}
                              className="max-w-sm"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                              Upload gambar berformat JPG, PNG, atau GIF.
                            </p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="flex justify-end space-x-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => navigate("/dashboard")}
                      >
                        Batal
                      </Button>
                      <Button type="submit" disabled={local.isSubmitting}>
                        {local.isSubmitting
                          ? "Menyimpan..."
                          : "Simpan Perubahan"}
                      </Button>
                    </CardFooter>
                  </>
                );
              }}
            </EForm>
          </Card>
        </div>
      </main>
    </Layout>
  );
};
