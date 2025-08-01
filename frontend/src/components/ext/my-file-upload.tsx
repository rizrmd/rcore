import { Button } from "@/components/ui/button";
import {
  FileUpload,
  FileUploadDropzone,
  FileUploadItem,
  FileUploadItemDelete,
  FileUploadItemPreview,
  FileUploadList,
  FileUploadTrigger,
} from "@/components/ui/file-upload";
import { useLocal } from "@/lib/hooks/use-local";
import { Upload, X } from "lucide-react";
import type { FC } from "react";

export type MyFileUploadProps = {
  title?: string;
  files?: File[];
  onImageChange?: (files: File[]) => void;
  maxSize?: number;
  maxFiles?: number;
  initialImage?: string;
  accept?: string;
};

export const MyFileUpload: FC<MyFileUploadProps> = ({
  title,
  files = [],
  onImageChange,
  maxSize = 1 * 1024 * 1024, // default to 1MB
  maxFiles = 1,
  initialImage,
  accept,
}) => {
  const local = useLocal({
    files: files,
    initialImage: initialImage || "",
  });

  return (
    <FileUpload
      maxFiles={maxFiles}
      maxSize={maxSize}
      className="w-full max-w-md"
      value={local.files}
      onValueChange={(files) => {
        local.files = files;
        if (onImageChange) onImageChange(files);
        local.render();
      }}
      accept={accept}
    >
      {!!title && <span className="font-medium text-sm">{title}</span>}
      {local.files.length === 0 && (
        <FileUploadDropzone>
          <div className="flex flex-col items-center gap-1 text-center">
            {initialImage ? (
              <div className="mb-2">
                <img
                  src={initialImage}
                  alt="Initial"
                  className="w-24 h-24 object-cover rounded-full border"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Gambar saat ini
                </p>
              </div>
            ) : (
              <div className="flex items-center justify-center rounded-full border p-2.5">
                <Upload className="size-6 text-muted-foreground" />
              </div>
            )}
            <p className="font-medium text-sm">Seret & taruh file di sini</p>
            <p className="text-muted-foreground text-xs">
              Atau klik untuk mencari (ukuran maks {maxSize / (1024 * 1024)}MB)
            </p>
          </div>
          <FileUploadTrigger asChild>
            <Button variant="outline" size="sm" className="mt-2 w-fit">
              Cari file
            </Button>
          </FileUploadTrigger>
        </FileUploadDropzone>
      )}
      <FileUploadList>
        {local.files.map((file, index) => (
          <FileUploadItem key={index} value={file}>
            <FileUploadItemPreview
              style={{ width: 100, height: 100, borderRadius: 100 }}
            />
            <FileUploadItemDelete asChild>
              <Button variant="ghost" size="icon" className="size-7">
                <X />
              </Button>
            </FileUploadItemDelete>
          </FileUploadItem>
        ))}
      </FileUploadList>
    </FileUpload>
  );
};
