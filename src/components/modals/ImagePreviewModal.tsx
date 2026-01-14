import React from "react";
import { X } from "lucide-react";
import { Attachment } from "../../../types";

interface ImagePreviewModalProps {
  image: Attachment;
  onClose: () => void;
}

/**
 * Full-screen image preview modal
 */
const ImagePreviewModal: React.FC<ImagePreviewModalProps> = ({
  image,
  onClose,
}) => {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <button className="absolute top-6 right-6 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors">
        <X size={24} />
      </button>
      <img
        src={image.url}
        alt={image.name}
        className="max-w-full max-h-full object-contain rounded-lg shadow-2xl animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  );
};

export default ImagePreviewModal;
