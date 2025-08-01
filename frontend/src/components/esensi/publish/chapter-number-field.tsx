import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/gen/publish.esensi";
import { useEffect, useState } from "react";

interface ChapterNumberFieldProps {
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
  readOnly?: boolean;
  required?: boolean;
  name: string;
  parentBookId?: string | number;
}

export const ChapterNumberField: React.FC<ChapterNumberFieldProps> = ({
  value,
  onChange,
  disabled,
  readOnly,
  required,
  name,
  parentBookId,
}) => {
  const [nextChapterNumber, setNextChapterNumber] = useState<number>(1);
  const [loading, setLoading] = useState(false);

  // Function to calculate next chapter number
  const calculateNextChapterNumber = async () => {
    setLoading(true);
    try {
      // Get book ID from props or ECrud state
      let bookId: string | null = null;

      if (parentBookId) {
        bookId = parentBookId.toString();
      } else {
        // Try to get book ID from window context (set by chapter form renderer)
        if ((window as any).currentBookId) {
          bookId = (window as any).currentBookId.toString();
        }
      }

      if (bookId) {
        // Get existing chapters for this book
        const response = await api.books({
          action: "nested_list",
          nested_model: "chapter",
          parent_id: bookId,
        });

        if (response.success && response.data) {
          const maxNumber = response.data.reduce(
            (max: number, chapter: any) => Math.max(max, chapter.number || 0),
            0
          );
          const calculatedNumber = maxNumber + 1;
          setNextChapterNumber(calculatedNumber);
          onChange(calculatedNumber);
        } else {
          setNextChapterNumber(1);
          onChange(1);
        }
      } else {
        setNextChapterNumber(1);
        onChange(1);
      }
    } catch (error) {
      console.error("Failed to calculate next chapter number:", error);
      setNextChapterNumber(1);
      onChange(1);
    } finally {
      setLoading(false);
    }
  };

  // Auto-calculate on mount if no value is set
  useEffect(() => {
    if (!value) {
      calculateNextChapterNumber();
    }
  }, []);

  return (
    <div className="flex items-center gap-2">
      <Input
        type="number"
        value={value || nextChapterNumber || ""}
        onChange={(e) => onChange(parseInt(e.target.value) || 0)}
        disabled={true}
        readOnly={true}
        required={required}
        placeholder={loading ? "Menghitung..." : "Nomor chapter"}
        className="flex-1 bg-gray-50"
      />
      {/* <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={calculateNextChapterNumber}
        disabled={disabled || loading}
        title="Hitung nomor chapter selanjutnya"
      >
        {loading ? "..." : "Auto"}
      </Button> */}
    </div>
  );
};
