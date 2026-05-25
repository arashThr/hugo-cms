interface SideNavBarProps {
    session: any;
    showSettings: boolean;
    setShowSettings: (show: boolean) => void;
    signOut: () => void;
}

export function SideNavBar({ session, showSettings, setShowSettings, signOut }: SideNavBarProps) {
    return (
        <nav className="fixed left-0 top-0 bottom-0 flex-col p-4 z-40 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-50 font-manrope text-xs font-semibold uppercase tracking-widest h-full w-64 border-r border-outline-variant hidden md:flex">
            {/* Header */}
            <div className="flex items-center gap-3 mb-8 px-2">
                <div className="w-8 h-8 rounded bg-primary flex items-center justify-center text-on-primary">
                    <span className="material-symbols-outlined text-lg">code</span>
                </div>
                <div>
                    <h1 className="text-xl font-black text-slate-900 dark:text-white capitalize tracking-tight">HugoFlow</h1>
                    <p className="text-[10px] text-on-surface-variant normal-case tracking-normal">Static Site Engine</p>
                </div>
            </div>

            {/* Main Navigation */}
            <div className="flex-1 space-y-1">
                <button onClick={() => setShowSettings(false)} className={`w-full flex items-center gap-3 rounded-md px-3 py-2 transition-all ${!showSettings ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm border border-slate-200 dark:border-slate-800' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-transparent'}`}>
                    <span className="material-symbols-outlined" data-icon="article">article</span>
                    Content
                </button>
                <button onClick={() => setShowSettings(true)} className={`w-full flex items-center gap-3 rounded-md px-3 py-2 transition-all ${showSettings ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm border border-slate-200 dark:border-slate-800' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-transparent'}`}>
                    <span className="material-symbols-outlined" data-icon="settings">settings</span>
                    Config
                </button>
            </div>

            {/* User Info */}
            <div className="mt-auto pt-4 border-t border-outline-variant flex items-center justify-between gap-3 px-2">
                <div className="flex items-center gap-3 overflow-hidden">
                    {session.user?.image && <img src={session.user.image} alt="User" className="w-8 h-8 rounded-full border border-outline-variant object-cover shrink-0" />}
                    <div className="flex flex-col overflow-hidden">
                        <span className="text-[11px] font-bold truncate text-slate-900 dark:text-white">{session.user?.name}</span>
                    </div>
                </div>
                <button onClick={() => signOut()} className="text-slate-500 hover:text-slate-900 dark:hover:text-white p-1 rounded transition-colors" title="Sign Out">
                    <span className="material-symbols-outlined text-[18px]">logout</span>
                </button>
            </div>
        </nav>
    );
}
