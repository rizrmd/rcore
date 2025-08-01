import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/lib/gen/internal.esensi";
import { useLocal } from "@/lib/hooks/use-local";
import type { CfgEntry } from "@/lib/utils";
import type { Author } from "shared/types";
import { Plus, Save, Trash2 } from "lucide-react";

interface CfgEditorProps {
  author: Author;
  canEdit?: boolean;
  onSave?: (updatedAuthor: Author) => void;
}

export const CfgEditor = ({
  author,
  canEdit = true,
  onSave,
}: CfgEditorProps) => {
  const local = useLocal(
    {
      entries: [] as CfgEntry[],
      loading: false,
      error: "",
    },
    async () => {
      // Parse existing cfg or initialize empty
      const cfg = (author.cfg as Record<string, any>) || {};
      local.entries = Object.entries(cfg).map(([key, value], index) => ({
        key,
        value:
          typeof value === "object"
            ? JSON.stringify(value, null, 2)
            : String(value),
        id: `${index}_${key}`,
      }));

      // Add empty entry if no entries exist and user can edit
      if (local.entries.length === 0 && canEdit) {
        local.entries.push({
          key: "",
          value: "",
          id: `new_${Date.now()}`,
        });
      }

      local.render();
    }
  );

  const addEntry = () => {
    local.entries.push({
      key: "",
      value: "",
      id: `new_${Date.now()}`,
    });
    local.render();
  };

  const removeEntry = (id: string) => {
    local.entries = local.entries.filter((entry) => entry.id !== id);
    local.render();
  };

  const updateEntry = (
    id: string,
    field: "key" | "value",
    newValue: string
  ) => {
    const entry = local.entries.find((e) => e.id === id);
    if (entry) {
      entry[field] = newValue;
      local.render();
    }
  };

  const validateEntries = (): { isValid: boolean; error: string } => {
    const keys = local.entries
      .filter((e) => e.key.trim())
      .map((e) => e.key.trim());
    const uniqueKeys = new Set(keys);

    if (keys.length !== uniqueKeys.size)
      return { isValid: false, error: "Kunci harus unik" };

    for (const entry of local.entries) {
      if (entry.key.trim() && !entry.value.trim()) {
        return {
          isValid: false,
          error: "Nilai tidak boleh kosong jika kunci diisi",
        };
      }
      if (!entry.key.trim() && entry.value.trim()) {
        return {
          isValid: false,
          error: "Kunci tidak boleh kosong jika nilai diisi",
        };
      }
    }

    return { isValid: true, error: "" };
  };

  const saveCfg = async () => {
    const validation = validateEntries();
    if (!validation.isValid) {
      local.error = validation.error;
      local.render();
      return;
    }

    local.loading = true;
    local.error = "";
    local.render();

    try {
      // Convert entries to cfg object
      const cfg: Record<string, any> = {};
      local.entries
        .filter((entry) => entry.key.trim() && entry.value.trim())
        .forEach((entry) => {
          // Try to parse as JSON, fallback to string
          try {
            cfg[entry.key.trim()] = JSON.parse(entry.value.trim());
          } catch {
            cfg[entry.key.trim()] = entry.value.trim();
          }
        });

      const result = await api.author_update({
        id: author.id!,
        cfg,
      });

      if (result.data) {
        onSave?.(result.data);
        local.error = "";
      } else {
        local.error = "Gagal menyimpan konfigurasi";
      }
    } catch (error) {
      local.error = "Terjadi kesalahan saat menyimpan";
      console.error(error);
    } finally {
      local.loading = false;
      local.render();
    }
  };

  return (
    <Card className="shadow-md border border-gray-200">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Konfigurasi Penulis</CardTitle>
          {!canEdit && (
            <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
              Hanya Baca
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {local.error && (
          <div className="text-red-600 text-sm bg-red-50 p-3 rounded-md">
            {local.error}
          </div>
        )}

        {local.entries.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            {canEdit
              ? "Belum ada konfigurasi. Klik 'Tambah Entri' untuk menambahkan."
              : "Belum ada konfigurasi."}
          </div>
        ) : (
          <div className="space-y-4">
            {local.entries.map((entry) => (
              <div
                key={entry.id}
                className="flex flex-col gap-3 p-4 border border-gray-200 rounded-md"
              >
                <div className="flex gap-3 items-start">
                  <div className="flex-1">
                    <Label
                      htmlFor={`key-${entry.id}`}
                      className="text-sm font-medium"
                    >
                      Kunci
                    </Label>
                    <Input
                      id={`key-${entry.id}`}
                      type="text"
                      value={entry.key}
                      onChange={(e) =>
                        updateEntry(entry.id, "key", e.target.value)
                      }
                      placeholder="Masukkan kunci"
                      className="mt-1"
                      disabled={!canEdit}
                      readOnly={!canEdit}
                    />
                  </div>
                  {canEdit && (
                    <div className="pt-6">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeEntry(entry.id)}
                        disabled={!canEdit || local.entries.length === 1}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
                <div>
                  <Label
                    htmlFor={`value-${entry.id}`}
                    className="text-sm font-medium"
                  >
                    Nilai
                  </Label>
                  <Textarea
                    id={`value-${entry.id}`}
                    value={entry.value}
                    onChange={(e) =>
                      updateEntry(entry.id, "value", e.target.value)
                    }
                    placeholder="Masukkan nilai (JSON/teks)"
                    className="mt-1 min-h-[60px]"
                    rows={3}
                    disabled={!canEdit}
                    readOnly={!canEdit}
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        {canEdit && (
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={addEntry}
              className="flex items-center gap-2"
              disabled={!canEdit}
            >
              <Plus className="h-4 w-4" />
              Tambah Entri
            </Button>

            <Button
              type="button"
              onClick={saveCfg}
              disabled={!canEdit || local.loading}
              className="flex items-center gap-2"
            >
              <Save className="h-4 w-4" />
              {local.loading ? "Menyimpan..." : "Simpan Konfigurasi"}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
