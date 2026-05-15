import React from 'react';

interface MobileHeaderProps {
  session: any;
  setShowSettings: (show: boolean) => void;
  signOut: () => void;
}

export function MobileHeader({ session, setShowSettings, signOut }: MobileHeaderProps) {
  return (
    <header className="flex justify-between items-center h-16 px-6 w-full bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-50 border-b border-slate-200 dark:border-slate-800 md:hidden">
      <div className="text-lg font-bold tracking-tighter">HugoFlow</div>
      <div className="flex items-center gap-4">
          <button onClick={() => setShowSettings(true)} className="hover:bg-slate-50 dark:hover:bg-slate-800 p-2 rounded-full">
              <span className="material-symbols-outlined">settings</span>
          </button>
          <div className="flex items-center gap-2">
              {session.user?.image && <img src={session.user.image} alt="User" className="w-8 h-8 rounded-full" />}
              <button onClick={() => signOut()} className="text-slate-500 hover:text-slate-900 dark:hover:text-white p-1 rounded transition-colors" title="Sign Out">
                  <span className="material-symbols-outlined text-[18px]">logout</span>
              </button>
          </div>
      </div>
    </header>
  );
}
