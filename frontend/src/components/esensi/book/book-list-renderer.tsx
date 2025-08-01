import React from "react";
import { BookCard } from "./book-card";
import { BundlingCard } from "./bundling-card";
import { GlobalLoading } from "../ui/global-loading";

interface BookListRendererProps {
  list: any[];
  loading: boolean;
  isBundle: boolean;
  noBooks: React.ReactNode;
}

export const BookListRenderer = ({ list, loading, isBundle, noBooks }: BookListRendererProps) => {
  if (loading) {
    return <GlobalLoading />;
  }

  if (list.length === 0) {
    return <>{noBooks}</>;
  }

  const renderList = list.map((book, idx) => {
    if (isBundle) {
      return (
        <div className="esensi-book flex w-full" key={`esensi_booklist_${idx}`}>
          <BundlingCard data={book} key={`esensi_booklist_${idx}`} />
        </div>
      );
    } else {
      return (
        <div className="esensi-book flex w-full" key={`esensi_booklist_${idx}`}>
          <BookCard data={book} key={`esensi_booklist_${idx}`} />
        </div>
      );
    }
  });

  return <>{renderList}</>;
};export default BookListRenderer;
