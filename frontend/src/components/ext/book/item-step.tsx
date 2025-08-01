import { navigate } from "@/lib/router";
import type { BookStep } from "@/lib/utils";
import type { Book } from "shared/types";

type BookStepItemProps = {
  step: BookStep;
  index: number;
  currentStep: number;
  book: Book | null;
};

export function BookStepItem({
  step,
  index,
  currentStep,
  book,
}: BookStepItemProps) {
  const isActiveOrHasApproval =
    currentStep >= step.step ||
    (step.step === 1 && !!book?.book_approval?.length);
  const isRejected = book?.status === "rejected";

  const handleClick = () => {
    if (isActiveOrHasApproval || isRejected) navigate(step.link);
  };

  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 pb-4 border-b border-gray-100 last:border-0">
      <div
        className={`flex items-center gap-3 md:gap-4 ${
          isActiveOrHasApproval || isRejected
            ? "opacity-100 cursor-pointer"
            : "opacity-50"
        }`}
        onClick={handleClick}
      >
        <div
          className={`min-w-[32px] h-8 flex items-center justify-center rounded-full text-sm font-medium ${
            isActiveOrHasApproval || isRejected
              ? "bg-blue-100 text-blue-700"
              : "bg-gray-100 text-gray-500"
          }`}
          style={{ width: "32px" }}
        >
          {index + 1}
        </div>
        <div className="pt-1 md:pt-0">
          <h2 className="text-lg font-semibold">
            {step.title}
            <span
              className={`ml-2 text-xs px-2 py-0.5 rounded-full ${
                currentStep > step.step
                  ? "bg-green-100 text-green-800"
                  : step.step === 0 &&
                    !!book?.book_approval?.length &&
                    book.status === "draft"
                  ? "bg-yellow-100 text-yellow-800"
                  : step.step === 1 &&
                    !!book?.book_approval?.length &&
                    book.status === "rejected"
                  ? "bg-red-100 text-red-800"
                  : ""
              }`}
            >
              {currentStep > step.step
                ? "Sudah ✅"
                : step.step === 0 &&
                  !!book?.book_approval?.length &&
                  book.status === "draft"
                ? "Butuh Revisi ❗"
                : step.step === 1 &&
                  !!book?.book_approval?.length &&
                  book.status === "rejected"
                ? "Ditolak"
                : ""}
            </span>
          </h2>
          <p className="text-gray-500 text-sm md:text-base">
            {step.description}
          </p>
        </div>
      </div>
    </div>
  );
}
