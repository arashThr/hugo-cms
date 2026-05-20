import React from 'react';
import { signIn } from 'next-auth/react';

export function LandingPage() {
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
        {/* Hero & Image Container */}
        <section className="w-full max-w-[1200px] flex flex-col md:flex-row items-center gap-[48px] mb-xl">
          {/* Hero Section */}
          <div className="flex-1 text-center md:text-left flex flex-col items-center md:items-start gap-lg">
            <h1 className="font-headline-xl text-[36px] md:text-[48px] leading-[1.2] tracking-[-0.02em] font-bold text-primary max-w-[700px]">
              A Git-Based CMS for Hugo
            </h1>
            <p className="font-body-lg text-[18px] leading-[1.7] text-on-surface-variant max-w-[600px]">
              An open-source, mobile-ready CMS for your Hugo blog. Enjoy rich text editing and easy image insertion without touching the terminal.
            </p>
            <div className="flex gap-md mt-sm">
              <button onClick={() => signIn("github")} className="bg-primary text-on-primary font-body-md text-[15px] px-6 py-3 rounded-lg hover:shadow-[0_4px_14px_0_rgba(0,0,0,0.1)] transition-all">
                Start Writing
              </button>
            </div>
          </div>

          {/* Editor Placeholder */}
          <div className="flex-1 w-full rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 shadow-[0_20px_50px_rgba(0,0,0,0.15)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.5)] bg-slate-100 dark:bg-slate-800 relative aspect-[1400/900] flex items-center justify-center ring-4 ring-white dark:ring-slate-900">
            {/* The image will fill the entire container */}
            <img src="/editor-screenshot.png" alt="Editor Screenshot" className="absolute inset-0 w-full h-full object-cover z-10" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
            
            {/* Fallback when image is missing or broken */}
            <div className="text-slate-400 dark:text-slate-500 flex flex-col items-center gap-2 relative p-4 text-center">
              <span className="material-symbols-outlined text-[48px]">image</span>
              <span className="font-body-md">Editor screenshot (1400x900)</span>
            </div>
          </div>
        </section>

        {/* Feature Bento Grid */}
        <section className="w-full max-w-[1200px] grid grid-cols-1 md:grid-cols-12 gap-[24px] mt-[48px]">
          {/* Feature 1: Large Card */}
          <div className="col-span-1 md:col-span-8 bg-surface-container-low rounded-xl p-[24px] border border-surface-variant flex flex-col gap-[16px] relative overflow-hidden group">
            <div className="z-10 flex flex-col gap-[8px] max-w-[400px]">
              <span className="material-symbols-outlined text-secondary text-[32px]">edit_document</span>
              <h3 className="font-headline-md text-[24px] font-semibold text-primary">Rich Text Editing</h3>
              <p className="font-body-md text-[15px] text-on-surface-variant">
                A custom distraction-free editor designed for writing. Write cleanly with syntax highlighting for Hugo shortcodes and simple Markdown support.
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
            <span className="material-symbols-outlined text-secondary text-[32px]">image</span>
            <h3 className="font-headline-md text-[20px] font-semibold text-primary">Easy Image Insertion</h3>
            <p className="font-body-md text-[15px] text-on-surface-variant">
              Seamlessly upload and insert images into your posts with automatic resizing and optimization.
            </p>
          </div>

          {/* Feature 3: Small Card */}
          <div className="col-span-1 md:col-span-5 bg-surface-container-low rounded-xl p-[24px] border border-surface-variant flex flex-col gap-[16px]">
            <span className="material-symbols-outlined text-secondary text-[32px]">smartphone</span>
            <h3 className="font-headline-md text-[20px] font-semibold text-primary">Mobile Ready</h3>
            <p className="font-body-md text-[15px] text-on-surface-variant">
              Manage your Hugo blog on the go. The entire editor and dashboard are fully responsive and optimized for mobile devices.
            </p>
          </div>

          {/* Image/Visual Card */}
          <div className="col-span-1 md:col-span-7 bg-surface-container-highest rounded-xl border border-surface-variant overflow-hidden min-h-[300px] relative">
            <div className="absolute inset-0 bg-primary/10"></div>
            <div className="absolute bottom-[24px] left-[24px] right-[24px]">
              <span className="font-label-caps text-[12px] font-semibold text-primary uppercase tracking-widest bg-white/80 backdrop-blur px-2 py-1 rounded inline-block mb-2">Open Source</span>
              <p className="font-headline-md text-[24px] font-semibold text-primary">Free forever, host it anywhere.</p>
            </div>
          </div>
        </section>
      </main>

      {/* Minimal Footer */}
      <footer className="w-full border-t border-surface-variant py-[24px] px-6 mt-auto flex flex-col items-center gap-4">
        <div className="flex flex-col md:flex-row items-center gap-2 md:gap-6 font-body-md text-[14px] text-on-surface-variant">
          <p className="text-center">
            © 2024 HugoFlow. An open-source project by <a href="https://arashtaher.com/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-semibold">Arash Taher</a>.
          </p>
          <a href="https://github.com/arashthr/hugo-flow" target="_blank" rel="noopener noreferrer" className="text-secondary hover:underline inline-flex items-center gap-1">
            <span className="material-symbols-outlined text-[18px]">code</span>
            View on GitHub
          </a>
        </div>
      </footer>
    </>
  );
}
