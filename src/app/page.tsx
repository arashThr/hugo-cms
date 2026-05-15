"use client";

import { useSession, signIn, signOut } from "next-auth/react";
import { useSettings } from "@/components/SettingsProvider";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";

export default function Home() {
  const { data: session, status } = useSession();
  const { settings, updateSettings, isLoaded } = useSettings();
  const [repos, setRepos] = useState<any[]>([]);
  const [loadingRepos, setLoadingRepos] = useState(false);
  const [tree, setTree] = useState<any[]>([]);
  const [loadingTree, setLoadingTree] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  
  const [searchQuery, setSearchQuery] = useState("");
  const [visibleCount, setVisibleCount] = useState(20);
  const [sortOrder, setSortOrder] = useState("Newest First");

  const router = useRouter();

  useEffect(() => {
    if (session) {
      fetchRepos();
    }
  }, [session]);

  useEffect(() => {
    if (session && settings.repository) {
      fetchTree();
    }
  }, [session, settings.repository]);

  const fetchRepos = async () => {
    setLoadingRepos(true);
    try {
      const res = await fetch("/api/github/repos");
      const data = await res.json();
      if (data.repos) {
        setRepos(data.repos);
      }
    } finally {
      setLoadingRepos(false);
    }
  };

  const fetchTree = async () => {
    setLoadingTree(true);
    const [owner, repo] = settings.repository.split("/");
    try {
      const res = await fetch(`/api/github/tree?owner=${owner}&repo=${repo}`);
      const data = await res.json();
      if (data.tree) {
        setTree(data.tree);
      }
    } finally {
      setLoadingTree(false);
    }
  };

  if (status === "loading" || !isLoaded) {
    return <div className="flex h-screen w-full items-center justify-center text-on-surface-variant font-body-md">Loading...</div>;
  }

  // --- Landing Page ---
  if (!session) {
    return (
      <>
        {/* TopNavBar */}
        <nav className="bg-white dark:bg-slate-900 font-manrope text-sm tracking-tight docked full-width top-0 z-50 border-b border-slate-200 dark:border-slate-800 flat no-shadows flex justify-between items-center h-16 px-6 w-full sticky">
          <div className="flex items-center gap-8">
            <span className="text-lg font-bold tracking-tighter text-slate-900 dark:text-white">HugoFlow</span>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={() => signIn("github")} className="bg-primary text-on-primary font-body-md text-[15px] px-4 py-2 rounded-lg hover:shadow-[0_4px_14px_0_rgba(0,0,0,0.1)] transition-all">
              Login with GitHub
            </button>
          </div>
        </nav>
        
        {/* Main Content */}
        <main className="flex-grow flex flex-col items-center w-full px-6 py-xl md:py-[120px]">
          {/* Hero Section */}
          <section className="max-w-editor-width text-center flex flex-col items-center gap-lg mb-xl">
            <h1 className="font-headline-xl text-[36px] md:text-[48px] leading-[1.2] tracking-[-0.02em] font-bold text-primary max-w-[700px]">
                Manage Hugo without touching the terminal.
            </h1>
            <p className="font-body-lg text-[18px] leading-[1.7] text-on-surface-variant max-w-[600px]">
                A clinical, high-velocity content management system designed specifically for Hugo. Experience distraction-free writing, visual front matter editing, and instant sync.
            </p>
            <div className="flex gap-md mt-sm">
              <button onClick={() => signIn("github")} className="bg-primary text-on-primary font-body-md text-[15px] px-6 py-3 rounded-lg hover:shadow-[0_4px_14px_0_rgba(0,0,0,0.1)] transition-all">
                  Start Writing
              </button>
            </div>
          </section>

          {/* Feature Bento Grid */}
          <section className="w-full max-w-[1200px] grid grid-cols-1 md:grid-cols-12 gap-[24px] mt-[48px]">
            {/* Feature 1: Large Card */}
            <div className="col-span-1 md:col-span-8 bg-surface-container-low rounded-xl p-[24px] border border-surface-variant flex flex-col gap-[16px] relative overflow-hidden group">
              <div className="z-10 flex flex-col gap-[8px] max-w-[400px]">
                <span className="material-symbols-outlined text-secondary text-[32px]">edit_document</span>
                <h3 className="font-headline-md text-[24px] font-semibold text-primary">Direct Markdown Editing</h3>
                <p className="font-body-md text-[15px] text-on-surface-variant">
                    A custom distraction-free editor constrained to the human eye's natural reading span. Write cleanly with syntax highlighting for Hugo shortcodes.
                </p>
              </div>
              <div className="absolute right-[-10%] bottom-[-20%] w-[60%] h-[120%] bg-surface border border-surface-variant rounded-xl shadow-sm rotate-[-5deg] opacity-80 group-hover:rotate-0 group-hover:translate-y-[-10px] transition-all duration-500 flex flex-col p-4">
                  <div className="h-4 w-1/3 bg-surface-dim rounded mb-4"></div>
                  <div className="h-2 w-full bg-surface-dim rounded mb-2"></div>
                  <div className="h-2 w-5/6 bg-surface-dim rounded mb-2"></div>
                  <div className="h-2 w-4/6 bg-surface-dim rounded"></div>
              </div>
            </div>

            {/* Feature 2: Small Card */}
            <div className="col-span-1 md:col-span-4 bg-surface-container-low rounded-xl p-[24px] border border-surface-variant flex flex-col gap-[16px]">
              <span className="material-symbols-outlined text-secondary text-[32px]">dashboard_customize</span>
              <h3 className="font-headline-md text-[20px] font-semibold text-primary">Visual Content Management</h3>
              <p className="font-body-md text-[15px] text-on-surface-variant">
                  Collapsible front matter drawers and clear status chips. Edit YAML/TOML metadata without friction.
              </p>
            </div>

            {/* Feature 3: Small Card */}
            <div className="col-span-1 md:col-span-5 bg-surface-container-low rounded-xl p-[24px] border border-surface-variant flex flex-col gap-[16px]">
              <span className="material-symbols-outlined text-secondary text-[32px]">rocket_launch</span>
              <h3 className="font-headline-md text-[20px] font-semibold text-primary">Instant Deployment</h3>
              <p className="font-body-md text-[15px] text-on-surface-variant">
                  Trigger builds and sync your static site engine directly from the interface. Keep your workflow in one place.
              </p>
            </div>

            {/* Image/Visual Card */}
            <div className="col-span-1 md:col-span-7 bg-surface-container-highest rounded-xl border border-surface-variant overflow-hidden min-h-[300px] relative">
              <div className="absolute inset-0 bg-primary/10"></div>
              <div className="absolute bottom-[24px] left-[24px] right-[24px]">
                <span className="font-label-caps text-[12px] font-semibold text-primary uppercase tracking-widest bg-white/80 backdrop-blur px-2 py-1 rounded inline-block mb-2">Built for speed</span>
                <p className="font-headline-md text-[24px] font-semibold text-primary">Treat content like code.</p>
              </div>
            </div>
          </section>
        </main>
        
        {/* Minimal Footer */}
        <footer className="w-full border-t border-surface-variant py-[16px] px-6 text-center mt-auto">
            <p className="font-body-md text-[13px] text-on-surface-variant">
                © 2024 HugoFlow. Minimalist static site management.
            </p>
        </footer>
      </>
    );
  }

  // --- Authenticated Repo Selection ---
  if (!settings.repository) {
    return (
      <div className="flex h-screen items-center justify-center bg-background p-6">
        <div className="w-full max-w-[600px] bg-surface-container-lowest rounded-xl p-[24px] border border-outline-variant shadow-sm flex flex-col gap-[16px]">
          <h2 className="font-headline-md text-[24px] text-primary">Select Repository</h2>
          <p className="font-body-md text-on-surface-variant mb-4">Choose the GitHub repository where your Hugo site is hosted.</p>
          
          {loadingRepos ? (
            <div className="flex justify-center py-8 text-on-surface-variant">Loading your repositories...</div>
          ) : (
            <div className="flex flex-col gap-2 max-h-[300px] overflow-y-auto pr-2 mb-4">
              {repos.map((repo) => (
                <button
                  key={repo.id}
                  className={`flex justify-between items-center p-4 rounded-lg border transition-all text-left ${settings.repository === repo.full_name ? 'border-primary bg-surface-container-low' : 'border-outline-variant hover:border-primary/50'}`}
                  onClick={() => {
                    updateSettings({ repository: repo.full_name });
                    setShowSettings(false);
                  }}
                >
                  <span className="font-body-md font-medium text-on-surface">{repo.full_name}</span>
                  {settings.repository === repo.full_name && <Check size={18} className="text-primary" />}
                </button>
              ))}
            </div>
          )}

          <div className="border-t border-outline-variant pt-6 mt-2 flex flex-col gap-[16px]">
            <h3 className="font-headline-md text-[18px] text-primary">Advanced Configuration</h3>
            <div className="flex flex-col gap-1">
              <label className="font-label-caps text-[12px] uppercase tracking-widest text-on-surface-variant">Content Path</label>
              <input 
                type="text" 
                value={settings.contentPath}
                onChange={(e) => updateSettings({ contentPath: e.target.value })}
                className="w-full bg-surface border border-outline-variant rounded-lg px-3 py-2 font-body-md text-on-surface focus:border-secondary focus:ring-1 focus:ring-secondary outline-none transition-all"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="font-label-caps text-[12px] uppercase tracking-widest text-on-surface-variant">Image Path</label>
              <input 
                type="text" 
                value={settings.imagePath}
                onChange={(e) => updateSettings({ imagePath: e.target.value })}
                className="w-full bg-surface border border-outline-variant rounded-lg px-3 py-2 font-body-md text-on-surface focus:border-secondary focus:ring-1 focus:ring-secondary outline-none transition-all"
              />
            </div>
          </div>
          

        </div>
      </div>
    );
  }

  // --- Authenticated Dashboard ---
  const allPosts = tree.filter((item) => 
    item.path.startsWith(settings.contentPath) && 
    item.type === "blob" && 
    item.path.endsWith(".md")
  ).sort((a, b) => {
    if (sortOrder === "Newest First") return b.path.localeCompare(a.path);
    if (sortOrder === "Oldest First") return a.path.localeCompare(b.path);
    return b.path.localeCompare(a.path);
  });

  const filteredPosts = allPosts.filter(post => 
    post.path.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  const visiblePosts = filteredPosts.slice(0, visibleCount);

  return (
    <div className="h-screen flex overflow-hidden">
      {/* SideNavBar */}
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

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col md:ml-64 bg-surface h-full overflow-hidden">
        {/* TopNavBar Mobile */}
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

        {/* Page Content Canvas */}
        <div className="flex-1 overflow-y-auto p-[24px] lg:p-[48px]">
            <div className="max-w-[1200px] mx-auto">
                {showSettings ? (
                  <div className="w-full max-w-[600px] bg-surface-container-lowest rounded-xl p-[24px] border border-outline-variant shadow-sm flex flex-col gap-[16px]">
                    <div className="flex items-center gap-2 mb-2 md:hidden">
                      <button onClick={() => setShowSettings(false)} className="text-on-surface-variant hover:text-on-surface flex items-center p-1 -ml-1 rounded-full hover:bg-surface-container">
                        <span className="material-symbols-outlined text-[20px]" data-icon="arrow_back">arrow_back</span>
                      </button>
                      <span className="font-label-caps text-[12px] uppercase tracking-widest text-on-surface-variant">Back to Contents</span>
                    </div>
                    <h2 className="font-headline-md text-[24px] text-primary">Settings</h2>
                    <p className="font-body-md text-on-surface-variant mb-4">Choose the GitHub repository where your Hugo site is hosted.</p>
                    
                    {loadingRepos ? (
                      <div className="flex justify-center py-8 text-on-surface-variant">Loading your repositories...</div>
                    ) : (
                      <div className="flex flex-col gap-2 max-h-[300px] overflow-y-auto pr-2 mb-4">
                        {repos.map((repo) => (
                          <button
                            key={repo.id}
                            className={`flex justify-between items-center p-4 rounded-lg border transition-all text-left ${settings.repository === repo.full_name ? 'border-primary bg-surface-container-low' : 'border-outline-variant hover:border-primary/50'}`}
                            onClick={() => {
                              updateSettings({ repository: repo.full_name });
                            }}
                          >
                            <span className="font-body-md font-medium text-on-surface">{repo.full_name}</span>
                            {settings.repository === repo.full_name && <Check size={18} className="text-primary" />}
                          </button>
                        ))}
                      </div>
                    )}

                    <div className="border-t border-outline-variant pt-6 mt-2 flex flex-col gap-[16px]">
                      <h3 className="font-headline-md text-[18px] text-primary">Advanced Configuration</h3>
                      <div className="flex flex-col gap-1">
                        <label className="font-label-caps text-[12px] uppercase tracking-widest text-on-surface-variant">Content Path</label>
                        <input 
                          type="text" 
                          value={settings.contentPath}
                          onChange={(e) => updateSettings({ contentPath: e.target.value })}
                          className="w-full bg-surface border border-outline-variant rounded-lg px-3 py-2 font-body-md text-on-surface focus:border-secondary focus:ring-1 focus:ring-secondary outline-none transition-all"
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="font-label-caps text-[12px] uppercase tracking-widest text-on-surface-variant">Image Path</label>
                        <input 
                          type="text" 
                          value={settings.imagePath}
                          onChange={(e) => updateSettings({ imagePath: e.target.value })}
                          className="w-full bg-surface border border-outline-variant rounded-lg px-3 py-2 font-body-md text-on-surface focus:border-secondary focus:ring-1 focus:ring-secondary outline-none transition-all"
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Page Header & Actions */}
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-[16px] mb-[48px]">
                    <div>
                        <h2 className="font-headline-xl text-[36px] font-bold text-on-surface mb-2">Posts</h2>
                        <p className="text-on-surface-variant font-body-md text-[15px]">Manage your blog content in <strong className="text-primary">{settings.repository}</strong>.</p>
                    </div>
                    <div className="flex items-center gap-[8px]">
                        <Link href="/editor" className="bg-primary text-on-primary px-4 py-2 rounded-lg font-label-caps text-[12px] uppercase tracking-widest hover:opacity-90 transition-opacity shadow-sm flex items-center gap-2">
                            <span className="material-symbols-outlined text-sm">add</span>
                            New Post
                        </Link>
                    </div>
                </div>

                {/* Filters & Search Toolbar */}
                <div className="flex flex-col md:flex-row gap-[16px] mb-[24px] p-[16px] bg-surface-container-lowest border border-outline-variant rounded-lg">
                    <div className="flex-1 relative">
                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant">search</span>
                        <input 
                          type="text"
                          className="w-full pl-10 pr-4 py-2 bg-transparent border-b border-outline-variant focus:border-secondary focus:ring-0 font-body-md text-[15px] text-on-surface placeholder:text-on-surface-variant outline-none transition-colors" 
                          placeholder="Search posts..." 
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <div className="flex items-center gap-[16px]">
                        <select 
                          className="bg-transparent border-b border-outline-variant py-2 pr-8 focus:border-secondary focus:ring-0 font-body-md text-[15px] text-on-surface outline-none cursor-pointer appearance-none"
                          value={sortOrder}
                          onChange={(e) => setSortOrder(e.target.value)}
                        >
                            <option>Newest First</option>
                            <option>Oldest First</option>
                        </select>
                    </div>
                </div>

                {/* Content List */}
                {loadingTree ? (
                  <div className="py-12 flex justify-center text-on-surface-variant">Loading posts...</div>
                ) : filteredPosts.length === 0 ? (
                  <div className="py-12 flex flex-col items-center justify-center text-center gap-4 bg-surface-container-lowest border border-outline-variant rounded-lg">
                    <span className="material-symbols-outlined text-[48px] text-outline-variant">article</span>
                    <div>
                      <h3 className="font-headline-md text-[20px] text-primary">No posts found</h3>
                      <p className="text-on-surface-variant mt-1">We couldn't find any markdown files matching your criteria.</p>
                    </div>
                  </div>
                ) : (
                  <div className="bg-surface-container-lowest border border-outline-variant rounded-lg overflow-hidden">
                      {/* Header Row */}
                      <div className="hidden md:grid grid-cols-12 gap-6 p-4 border-b border-outline-variant bg-surface-container-low font-label-caps text-[12px] uppercase tracking-widest text-on-surface-variant">
                          <div className="col-span-8">File Name</div>
                          <div className="col-span-4">Date</div>
                      </div>
                      
                      {/* List Items */}
                      <div className="divide-y divide-outline-variant">
                          {visiblePosts.map((post) => {
                            const filename = post.path.split("/").pop() || post.path;
                            const dateMatch = filename.match(/\d{4}-\d{2}-\d{2}/);
                            const dateStr = dateMatch ? dateMatch[0] : "—";
                            return (
                              <div key={post.sha} className="group grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-6 p-4 items-center hover:bg-surface-bright transition-colors relative">
                                  <div className="col-span-1 md:col-span-8 flex flex-col gap-1">
                                      <Link href={`/editor?path=${encodeURIComponent(post.path)}`} className="font-headline-md text-[20px] font-semibold text-on-surface group-hover:text-primary transition-colors before:absolute before:inset-0">
                                        {filename}
                                      </Link>
                                      <div className="flex gap-2 font-mono text-[13px] text-on-surface-variant">
                                          <span>/{post.path}</span>
                                      </div>
                                  </div>
                                  <div className="hidden md:block md:col-span-4 font-mono text-[13px] text-on-surface-variant">
                                      {dateStr}
                                  </div>
                              </div>
                            );
                          })}
                      </div>
                  </div>
                )}

                {/* Pagination */}
                {visiblePosts.length < filteredPosts.length && (
                  <div className="flex items-center justify-center mt-[16px] py-4">
                      <button 
                        onClick={() => setVisibleCount(v => v + 20)}
                        className="px-4 py-2 border border-outline-variant text-primary rounded-lg hover:bg-surface-container transition-colors font-label-caps text-[12px] uppercase tracking-widest"
                      >
                        Load More
                      </button>
                  </div>
                )}
                </>
              )}
            </div>
        </div>
      </main>
    </div>
  );
}
