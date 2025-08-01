import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { api as internalApi } from "@/lib/gen/internal.esensi";
import { api } from "@/lib/gen/publish.esensi";
import { Send } from "lucide-react";
import type { book } from "shared/models";
import { BookStatus } from "shared/types";

/**
 * Get display label for book status
 */
export const getBookStatusLabel = (status: string) => {
  switch (status) {
    case "draft":
      return "Draft";
    case "submitted":
      return "Diajukan";
    case "published":
      return "Diterbitkan";
    case "rejected":
      return "Ditolak";
    default:
      return status;
  }
};

/**
 * Get badge variant for book status
 */
export const getBookStatusVariant = (status: string) => {
  switch (status) {
    case "published":
      return "default";
    case "submitted":
      return "secondary";
    case "rejected":
      return "destructive";
    default:
      return "outline";
  }
};

/**
 * Book Status Badge Component
 */
interface BookStatusBadgeProps {
  status: string;
  className?: string;
}

export const BookStatusBadge: React.FC<BookStatusBadgeProps> = ({
  status,
  className,
}) => (
  <Badge variant={getBookStatusVariant(status)} className={className}>
    {getBookStatusLabel(status)}
  </Badge>
);

/**
 * Submit Book Button Component
 */
interface SubmitBookButtonProps {
  book: book;
  onSubmit?: () => void;
}

export const SubmitBookButton: React.FC<SubmitBookButtonProps> = ({
  book,
  onSubmit,
}) => {
  const handleSubmit = async () => {
    try {
      // Update book status to submitted
      await api.books({
        action: "update",
        id: book.id,
        status: BookStatus.SUBMITTED,
      });

      // Create initial book approval record and notification
      await internalApi.book_approval_create({
        id_book: book.id,
        comment: "Penulis mengajukan buku untuk ditinjau dan diterbitkan.",
        status: BookStatus.SUBMITTED,
      });

      // Trigger callback or refresh
      if (onSubmit) {
        onSubmit();
      } else {
        window.location.reload();
      }
    } catch (error) {
      console.error("Failed to submit book:", error);
    }
  };

  // Hide submit button for chapter books and non-draft books
  if (!book.id || book.status !== "draft" || book.is_chapter) {
    return null;
  }

  return (
    <Button
      size="sm"
      className="bg-blue-600 hover:bg-blue-700 text-white font-medium"
      onClick={handleSubmit}
    >
      <Send className="w-4 h-4 mr-1" />
      Ajukan Penerbitan
    </Button>
  );
};

/**
 * Book Status Header Component
 * Displays status badge and submit button for a book
 */
interface BookStatusHeaderProps {
  book: book;
  onSubmit?: () => void;
}

export const BookStatusHeader: React.FC<BookStatusHeaderProps> = ({
  book,
  onSubmit,
}) => {
  if (!book.status) return null;

  // Hide status badge for chapter books since their status is determined by individual chapters
  const showStatusBadge = !book.is_chapter;

  return (
    <div className="flex items-center gap-2">
      {showStatusBadge && <BookStatusBadge status={book.status} />}
      <SubmitBookButton book={book} onSubmit={onSubmit} />
    </div>
  );
};
