import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  FileUpload,
  FileUploadDropzone,
  FileUploadList,
} from "@/components/ui/file-upload";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { baseUrl } from "@/lib/gen/base-url";

// Categories list
const categories = [
  { label: "Fiksi", value: "fiction" },
  { label: "Non-Fiksi", value: "non-fiction" },
  { label: "Pendidikan", value: "education" },
  { label: "Anak-anak", value: "children" },
  { label: "Bisnis", value: "business" },
  { label: "Pengembangan Diri", value: "self-help" },
  { label: "Sains", value: "science" },
  { label: "Teknologi", value: "technology" },
  { label: "Sejarah", value: "history" },
];

export interface BookFormData {
  name: string;
  slug: string;
  desc: string;
  price: string;
  status: string;
  category: string;
  published_date: string;
  cover_image: string;
}

export interface BookFormErrors {
  name: string;
  slug: string;
  price: string;
}

interface BookFormProps {
  title: string;
  description: string;
  formData: BookFormData;
  coverImage: File | null;
  errors: BookFormErrors;
  loading: boolean;
  isEdit?: boolean;
  onFormDataChange: (field: keyof BookFormData, value: string) => void;
  onCoverImageChange: (file: File | null) => void;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
  onSlugGenerate: () => void;
}

export const BookForm = ({
  title,
  description,
  formData,
  coverImage,
  errors,
  loading,
  isEdit = false,
  onFormDataChange,
  onCoverImageChange,
  onSubmit,
  onCancel,
  onSlugGenerate,
}: BookFormProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>

      <form onSubmit={onSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="block text-sm font-medium">Judul Buku</label>
            <Input
              type="text"
              value={formData.name}
              onChange={(e) => onFormDataChange("name", e.target.value)}
              placeholder="Masukkan judul buku"
              disabled={loading}
            />
            {errors.name && (
              <p className="text-sm text-red-500">{errors.name}</p>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-sm font-medium">Slug</label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onSlugGenerate}
                disabled={loading || !formData.name}
              >
                Generate dari Judul
              </Button>
            </div>
            <Input
              type="text"
              value={formData.slug}
              onChange={(e) => onFormDataChange("slug", e.target.value)}
              placeholder="judul-buku-anda"
              disabled={loading}
            />
            {errors.slug && (
              <p className="text-sm text-red-500">{errors.slug}</p>
            )}
            <p className="text-xs text-gray-500">
              Slug akan digunakan dalam URL buku Anda
            </p>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium">Deskripsi</label>
            <Textarea
              value={formData.desc}
              onChange={(e) => onFormDataChange("desc", e.target.value)}
              placeholder="Deskripsi tentang buku Anda"
              rows={4}
              disabled={loading}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium">Kategori</label>
              <Select
                value={formData.category}
                onValueChange={(value) => onFormDataChange("category", value)}
                disabled={loading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih kategori" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.value} value={category.value}>
                      {category.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium">
                Harga (opsional)
              </label>
              <Input
                type="text"
                value={formData.price}
                onChange={(e) => onFormDataChange("price", e.target.value)}
                placeholder="Masukkan harga buku"
                disabled={loading}
              />
              {errors.price && (
                <p className="text-sm text-red-500">{errors.price}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium">Status</label>
              <Select
                value={formData.status}
                onValueChange={(value) => onFormDataChange("status", value)}
                disabled={loading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="review">Sedang Ditinjau</SelectItem>
                  <SelectItem value="published">Dipublikasikan</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium">
                {isEdit ? "Tanggal Publikasi" : "Tanggal Publikasi (opsional)"}
              </label>
              <Input
                type="date"
                value={formData.published_date}
                onChange={(e) =>
                  onFormDataChange("published_date", e.target.value)
                }
                disabled={loading}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium">Cover Buku</label>

            {isEdit && formData.cover_image && !coverImage && (
              <div className="mb-4">
                <p className="text-sm mb-2">Cover saat ini:</p>
                <div className="w-48 h-64 border rounded overflow-hidden">
                  <img
                    src={`${baseUrl.auth_esensi}/uploads/${formData.cover_image}`}
                    alt="Cover buku saat ini"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            )}

            <FileUpload
              maxFiles={1}
              maxSize={2 * 1024 * 1024} // 2MB
              className="w-full"
              value={coverImage ? [coverImage] : []}
              onValueChange={(files) =>
                onCoverImageChange(files.length > 0 ? files[0] : null)
              }
              accept="image/*"
              disabled={loading}
            >
              <FileUploadDropzone>
                <div className="text-center space-y-2">
                  <div className="text-3xl">🖼️</div>
                  <div className="text-sm font-medium">
                    {isEdit ? "Ganti Cover Buku" : "Unggah Cover Buku"}
                  </div>
                  <div className="text-xs text-gray-500">
                    {isEdit
                      ? "Unggah gambar baru untuk mengganti cover buku Anda"
                      : "Tarik dan lepas file gambar di sini atau klik untuk menjelajah"}
                  </div>
                </div>
              </FileUploadDropzone>
              <FileUploadList />
            </FileUpload>
            <p className="text-xs text-gray-500">
              Format yang diterima: JPG, PNG, atau WebP (maks. 2MB)
            </p>
          </div>
        </CardContent>

        <CardFooter className="flex justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={loading}
          >
            Kembali
          </Button>
          <Button type="submit" disabled={loading}>
            {loading
              ? "Menyimpan..."
              : isEdit
              ? "Simpan Perubahan"
              : "Simpan Buku"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
};
