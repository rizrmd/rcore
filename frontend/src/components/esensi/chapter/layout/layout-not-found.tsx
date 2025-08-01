import { Button } from "@/components/ui/button";
import { EsensiChapterLayout } from "./layout";
import { ArrowLeft } from "lucide-react";
import { EsensiChapterLogo } from "../svg/esensi-chapter-logo";

export const EsensiChapterNotFound = () => {
  return (
    <EsensiChapterLayout
      enableHeader={false}
      enableFooter={false}
      enableProfileDrawer={false}
    >
      <div className="max-w-lg mx-auto h-screen flex justify-center items-center">
        <div className="flex flex-col items-center justify-center text-center">
            <EsensiChapterLogo className="h-13 w-auto mb-10"/>
          <h1 className="text-9xl font-bold text-(--esensi-color-alt) mb-4">
            404
          </h1>
          <h2 className="text-3xl font-bold text-(--esensi-color) mb-6">
            NOT FOUND
          </h2>
          <p className="text-lg text-gray-500 mb-8">
            The page you're looking for doesn't exist.
          </p>
          <Button
            onClick={() => window.history.back()}
            size={"lg"}
            className="esensi-button flex gap-2 items-center"
          >
            <ArrowLeft /> <span>Go Back</span>
          </Button>
        </div>
      </div>
    </EsensiChapterLayout>
  );
};
