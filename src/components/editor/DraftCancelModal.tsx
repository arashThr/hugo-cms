import React from 'react';
import { useRouter } from 'next/navigation';

interface DraftCancelModalProps {
  showCancelModal: boolean;
  setShowCancelModal: (val: boolean) => void;
}

export function DraftCancelModal({
  showCancelModal,
  setShowCancelModal
}: DraftCancelModalProps) {
  const router = useRouter();

  if (!showCancelModal) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-surface-container-lowest rounded-xl p-[24px] max-w-md w-full border border-outline-variant shadow-xl flex flex-col gap-[16px]">
        <h3 className="font-headline-md text-[20px] text-primary">Unsaved Draft</h3>
        <p className="font-body-md text-[14px] text-on-surface-variant">
          You have an unsaved draft. Do you want to keep it for later or clean it before leaving?
        </p>
        <div className="flex flex-col gap-2 mt-4">
          <button
            onClick={() => {
              setShowCancelModal(false);
              router.push('/');
            }}
            className="w-full text-left px-4 py-3 border border-outline-variant rounded-lg hover:bg-surface-container transition-colors font-body-md font-medium text-on-surface"
          >
            Keep Draft and Leave
          </button>
          <button
            onClick={() => {
              localStorage.removeItem('hugo_draft');
              setShowCancelModal(false);
              router.push('/');
            }}
            className="w-full text-left px-4 py-3 border border-red-200 bg-red-50 rounded-lg hover:bg-red-100 text-red-700 transition-colors font-body-md font-medium"
          >
            Clean Draft and Leave
          </button>
          <button
            onClick={() => setShowCancelModal(false)}
            className="w-full text-center px-4 py-3 text-on-surface-variant hover:bg-surface-container rounded-lg transition-colors font-body-md mt-2"
          >
            Stay on Page
          </button>
        </div>
      </div>
    </div>
  );
}
