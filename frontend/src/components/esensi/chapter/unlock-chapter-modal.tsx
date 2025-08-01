import { X, Coins } from "lucide-react";
import React from "react";

interface UnlockChapterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  chapterTitle: string;
  chapterNumber: number;
  coinPrice: number;
}

export const UnlockChapterModal = ({
  isOpen,
  onClose,
  onConfirm,
  chapterTitle,
  chapterNumber,
  coinPrice
}: UnlockChapterModalProps) => {
  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        {/* Modal */}
        <div 
          className="bg-white rounded-lg max-w-md w-full p-6 relative"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Icon */}
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center">
              <Coins className="w-8 h-8 text-yellow-600" />
            </div>
          </div>

          {/* Content */}
          <div className="text-center mb-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Buka Chapter {chapterNumber}
            </h3>
            <p className="text-gray-600 mb-4">
              Apakah Anda yakin ingin membuka <span className="font-medium">"{chapterTitle}"</span> dengan <span className="font-semibold text-yellow-600">{coinPrice} coins</span>?
            </p>
          </div>

          {/* Buttons */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              Batal
            </button>
            <button
              onClick={onConfirm}
              className="flex-1 px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors font-medium flex items-center justify-center gap-2"
            >
              <Coins className="w-4 h-4" />
              <span>Buka Chapter</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
};