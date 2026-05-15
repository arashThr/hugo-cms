import React from 'react';

interface ImageSizeModalProps {
  pendingImage: { file: File; type: 'inline' | 'featured' } | null;
  compressing: boolean;
  confirmImageUpload: (maxWidth: number) => void;
  setPendingImage: (val: { file: File; type: 'inline' | 'featured' } | null) => void;
}

export function ImageSizeModal({
  pendingImage,
  compressing,
  confirmImageUpload,
  setPendingImage
}: ImageSizeModalProps) {
  if (!pendingImage) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-surface-container-lowest rounded-xl p-[24px] max-w-sm w-full border border-outline-variant shadow-xl flex flex-col gap-[16px]">
        <h3 className="font-headline-md text-[20px] text-primary">Select Image Size</h3>
        <p className="font-body-md text-[14px] text-on-surface-variant">
          Choose an optimized size for your image before uploading.
        </p>
        <div className="flex flex-col gap-2 mt-2">
          <button onClick={() => confirmImageUpload(300)} disabled={compressing} className="w-full text-left px-4 py-3 border border-outline-variant rounded-lg hover:bg-surface-container transition-colors flex justify-between items-center group disabled:opacity-50">
            <span className="font-body-md font-medium text-on-surface">Small</span>
            <span className="font-mono text-[12px] text-on-surface-variant group-hover:text-primary transition-colors">Max 300px</span>
          </button>
          <button onClick={() => confirmImageUpload(600)} disabled={compressing} className="w-full text-left px-4 py-3 border border-outline-variant rounded-lg hover:bg-surface-container transition-colors flex justify-between items-center group disabled:opacity-50">
            <span className="font-body-md font-medium text-on-surface">Medium</span>
            <span className="font-mono text-[12px] text-on-surface-variant group-hover:text-primary transition-colors">Max 600px</span>
          </button>
          <button onClick={() => confirmImageUpload(960)} disabled={compressing} className="w-full text-left px-4 py-3 border border-outline-variant rounded-lg hover:bg-surface-container transition-colors flex justify-between items-center group disabled:opacity-50">
            <span className="font-body-md font-medium text-on-surface">Large</span>
            <span className="font-mono text-[12px] text-on-surface-variant group-hover:text-primary transition-colors">Max 960px</span>
          </button>
        </div>
        <div className="flex justify-end mt-2">
          <button onClick={() => setPendingImage(null)} disabled={compressing} className="font-label-caps text-[12px] uppercase tracking-widest px-4 py-2 text-on-surface-variant hover:bg-surface-container rounded-lg transition-colors disabled:opacity-50">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
