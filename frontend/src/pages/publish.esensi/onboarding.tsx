import { Protected } from "@/components/app/protected";
import { Error } from "@/components/ext/error";
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
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { betterAuth } from "@/lib/better-auth";
import { baseUrl } from "@/lib/gen/base-url";
import { api } from "@/lib/gen/publish.esensi";
import { useLocal } from "@/lib/hooks/use-local";
import { navigate } from "@/lib/router";
import { getMimeType } from "@/lib/utils";
import type { UploadAPIResponse } from "shared/types";
import type { User } from "shared/types";
import { Role } from "shared/types";
import type { FormEvent } from "react";

export const current = {
  user: undefined as User | undefined,
};

export default () => {
  const local = useLocal(
    {
      submitting: false,
      roles: {
        publisher: false,
        author: true,
      },
      role: Role.AUTHOR, // Default to author
      files: [] as File[],
      formData: {
        publisher: {
          name: "",
          description: "",
          website: "",
          address: "",
          logo: null as string | null,
        },
        author: {
          name: "",
          biography: "",
          social_media: "",
          avatar: null as string | null,
        },
        files: {
          publisher: [] as File[],
          author: [] as File[],
        },
      },
      error: "",
      success: "",
    },
    async () => {
      const res = await betterAuth.getSession();
      current.user = res.data?.user;
      if (!current.user) return;
      local.formData.publisher.name = current.user?.name!;
      local.formData.author.name = current.user?.name!;
      local.formData.publisher.logo = current.user?.image || null;
      local.formData.author.avatar = current.user?.image || null;
      await loadData();
    }
  );

  async function loadData() {
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
        local.formData.files.author = [file];
        local.formData.files.publisher = [file];
      } catch (error) {
        console.error("Error fetching profile image:", error);
      } finally {
        local.render();
      }
    }
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (local.submitting) return;

    local.submitting = true;
    local.error = "";
    local.success = "";
    local.render();

    try {
      if (local.role === Role.PUBLISHER) {
        const publisherData = local.formData.publisher;

        if (!publisherData.name) {
          local.error = "Nama penerbit harus diisi";
          local.submitting = false;
          local.render();
          return;
        }

        if (local.formData.files.publisher.length > 0) {
          const file = local.formData.files.publisher[0];
          const formData = new FormData();
          formData.append("file", file);
          const res = await fetch(`${baseUrl.auth_esensi}/api/upload`, {
            method: "POST",
            body: formData,
          });
          const uploaded: UploadAPIResponse = await res.json();
          if (uploaded.name) local.formData.publisher.logo = uploaded.name;
        }

        const result = await api.onboarding({
          role: Role.PUBLISHER,
          userId: current.user!.id as string,
          data: local.formData.publisher,
        });

        if (result.success) {
          local.success = "Profil penerbit berhasil dibuat";
          location.href = "/dashboard";
        } else local.error = result.message || "Gagal membuat profil penerbit";
      } else if (local.role === Role.AUTHOR) {
        const authorData = local.formData.author;

        if (!authorData.name) {
          local.error = "Nama penulis harus diisi";
          local.submitting = false;
          local.render();
          return;
        }

        if (local.formData.files.author.length > 0) {
          const file = local.formData.files.author[0];
          const formData = new FormData();
          formData.append("file", file);
          const res = await fetch(`${baseUrl.auth_esensi}/api/upload`, {
            method: "POST",
            body: formData,
          });
          const uploaded: UploadAPIResponse = await res.json();
          if (uploaded.name) local.formData.author.avatar = uploaded.name;
        }

        const result = await api.onboarding({
          role: Role.AUTHOR,
          userId: current.user!.id as string,
          data: local.formData.author,
        });

        if (result.success) {
          local.success = "Profil penulis berhasil dibuat";
          window.location.href = "/dashboard";
        } else local.error = result.message || "Gagal membuat profil penulis";
      }
    } catch (error) {
      console.error("Error in onboarding:", error);
      local.error = "Terjadi kesalahan saat menyimpan profil";
    } finally {
      local.submitting = false;
      local.render();
    }
  };

  return (
    <Protected
      onLoad={({ user }) => {
        if (user) {
          if (user?.idAuthor || user?.idPublisher) {
            navigate("/dashboard");
            return;
          }
        }
      }}
    >
      <div className="flex min-h-svh flex-col">
        <MenuBarPublish />
        <div className="flex-1 container py-6 md:py-10">
          <div className="max-w-3xl mx-auto">
            <Card>
              <CardHeader>
                <CardTitle>Selamat Datang di Platform Penerbitan</CardTitle>
                <CardDescription>
                  Lengkapi profil Anda untuk mulai menerbitkan dan mengelola
                  buku.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Error msg={local.error} />
                <Success msg={local.success} />
                <Tabs
                  value={local.role}
                  onValueChange={(value: Role) => {
                    local.role = value;
                    local.render();
                  }}
                  className="w-full"
                >
                  {/* <TabsList className="grid grid-cols-2 mb-8">
                    {local.roles.publisher && (
                      <TabsTrigger value={Role.PUBLISHER}>
                        Saya Penerbit
                      </TabsTrigger>
                    )}
                    {local.roles.author && (
                      <TabsTrigger value={Role.AUTHOR}>
                        Saya Penulis
                      </TabsTrigger>
                    )}
                  </TabsList> */}
                  <TabsContent value={Role.PUBLISHER}>
                    <form onSubmit={handleSubmit} className="space-y-6">
                      <div className="grid md:grid-cols-[1fr_auto] gap-6">
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="publisher-name">
                              Nama Penerbit
                            </Label>
                            <Input
                              id="publisher-name"
                              value={local.formData.publisher.name}
                              onChange={(e) => {
                                local.formData.publisher.name = e.target.value;
                                local.render();
                              }}
                              placeholder="Masukkan nama penerbit"
                              className="mt-1"
                              required
                            />
                          </div>

                          <div>
                            <Label htmlFor="publisher-desc">Deskripsi</Label>
                            <textarea
                              id="publisher-desc"
                              value={local.formData.publisher.description}
                              onChange={(e) => {
                                local.formData.publisher.description =
                                  e.target.value;
                                local.render();
                              }}
                              placeholder="Sekilas tentang penerbit Anda"
                              className="mt-1 flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                            />
                          </div>

                          <div>
                            <Label htmlFor="publisher-website">Website</Label>
                            <Input
                              id="publisher-website"
                              value={local.formData.publisher.website}
                              onChange={(e) => {
                                local.formData.publisher.website =
                                  e.target.value;
                                local.render();
                              }}
                              placeholder="https://website-penerbit.com"
                              className="mt-1"
                            />
                          </div>

                          <div>
                            <Label htmlFor="publisher-address">Alamat</Label>
                            <textarea
                              id="publisher-address"
                              value={local.formData.publisher.address}
                              onChange={(e) => {
                                local.formData.publisher.address =
                                  e.target.value;
                                local.render();
                              }}
                              placeholder="Alamat lengkap kantor penerbit"
                              className="mt-1 flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                            />
                          </div>
                        </div>

                        <div>
                          <Label>Logo Penerbit</Label>
                          <div className="mt-2 flex items-center gap-4">
                            {local.formData.publisher.logo ||
                            local.formData.files.publisher.length > 0 ? (
                              <div className="relative w-20 h-20 rounded-full overflow-hidden border bg-gray-100">
                                <img
                                  src={
                                    local.formData.files.publisher.length > 0
                                      ? URL.createObjectURL(
                                          local.formData.files.publisher[0]
                                        )
                                      : `${baseUrl.auth_esensi}/${local.formData.publisher.logo}`
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
                                    local.formData.files.publisher = [
                                      e.target.files[0],
                                    ];
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
                      </div>

                      <Button
                        type="submit"
                        className="w-full"
                        disabled={local.submitting}
                      >
                        {local.submitting
                          ? "Memproses..."
                          : "Daftar Sebagai Penerbit"}
                      </Button>
                    </form>
                  </TabsContent>

                  <TabsContent value={Role.AUTHOR}>
                    <form onSubmit={handleSubmit} className="space-y-6">
                      <div className="grid md:grid-cols-[1fr_auto] gap-6">
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="author-name">Nama Penulis</Label>
                            <Input
                              id="author-name"
                              value={local.formData.author.name}
                              onChange={(e) => {
                                local.formData.author.name = e.target.value;
                                local.render();
                              }}
                              placeholder="Masukkan nama penulis"
                              className="mt-1"
                              required
                            />
                          </div>

                          <div>
                            <Label htmlFor="author-bio">Biografi</Label>
                            <textarea
                              id="author-bio"
                              value={local.formData.author.biography}
                              onChange={(e) => {
                                local.formData.author.biography =
                                  e.target.value;
                                local.render();
                              }}
                              placeholder="Ceritakan tentang diri Anda sebagai penulis"
                              rows={4}
                              className="mt-1 flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                            />
                          </div>

                          <div>
                            <Label htmlFor="author-socmed">Media Sosial</Label>
                            <Input
                              id="author-socmed"
                              value={local.formData.author.social_media}
                              onChange={(e) => {
                                local.formData.author.social_media =
                                  e.target.value;
                                local.render();
                              }}
                              placeholder="Instagram, Twitter, atau website pribadi"
                              className="mt-1"
                            />
                          </div>
                        </div>

                        <div>
                          <Label>Foto Profil</Label>
                          <div className="mt-2 flex items-center gap-4">
                            {local.formData.author.avatar ||
                            local.formData.files.author.length > 0 ? (
                              <div className="relative w-20 h-20 rounded-full overflow-hidden border bg-gray-100">
                                <img
                                  src={
                                    local.formData.files.author.length > 0
                                      ? URL.createObjectURL(
                                          local.formData.files.author[0]
                                        )
                                      : `${baseUrl.auth_esensi}/${local.formData.author.avatar}`
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
                                    local.formData.files.author = [
                                      e.target.files[0],
                                    ];
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
                      </div>

                      <Button
                        type="submit"
                        className="w-full"
                        disabled={local.submitting}
                      >
                        {local.submitting
                          ? "Memproses..."
                          : "Daftar Sebagai Penulis"}
                      </Button>
                    </form>
                  </TabsContent>
                </Tabs>
              </CardContent>
              <CardFooter className="border-t bg-muted/50 flex justify-between">
                <div className="text-sm text-muted-foreground">
                  * Anda bisa mengubah informasi ini nanti di halaman profil
                </div>
              </CardFooter>
            </Card>
          </div>
        </div>
      </div>
    </Protected>
  );
};
