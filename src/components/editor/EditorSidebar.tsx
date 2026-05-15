import React from 'react';

interface EditorSidebarProps {
  slug: string;
  setSlug: (val: string) => void;
  title: string;
  date: string;
  setDate: (val: string) => void;
  tags: string;
  setTags: (val: string) => void;
  featuredImage: string | null;
  handleFeaturedImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  featuredImageInputRef: React.RefObject<HTMLInputElement | null>;
  layout: string;
  setLayout: (val: string) => void;
  fetching: boolean;
  showSidebar: boolean;
  setShowSidebar: (val: boolean) => void;
}

export function EditorSidebar({
  slug,
  setSlug,
  title,
  date,
  setDate,
  tags,
  setTags,
  featuredImage,
  handleFeaturedImageUpload,
  featuredImageInputRef,
  layout,
  setLayout,
  fetching,
  showSidebar,
  setShowSidebar
}: EditorSidebarProps) {
  return (
    <aside className={`w-full ${showSidebar ? 'lg:w-80' : 'lg:w-16'} border-t lg:border-t-0 lg:border-l border-outline-variant bg-surface-container-lowest shrink-0 lg:overflow-y-auto flex flex-col shadow-[-4px_0_24px_rgba(0,0,0,0.02)] transition-all overflow-hidden`}>
      <div className="p-[16px] border-b border-outline-variant flex items-center justify-between sticky top-0 bg-surface-container-lowest/95 backdrop-blur z-10">
        {showSidebar && <h2 className="font-label-caps text-[12px] uppercase tracking-widest text-on-surface-variant whitespace-nowrap">Post Metadata</h2>}
        <button onClick={() => setShowSidebar(!showSidebar)} className={`text-on-surface-variant hover:text-on-surface flex-shrink-0 ${!showSidebar && 'mx-auto'}`}>
          <span className="material-symbols-outlined text-[20px]" data-icon="tune">tune</span>
        </button>
      </div>

      {showSidebar && (
        <div className="p-[24px] flex flex-col gap-[24px]">
          {/* URL Slug */}
          <div className="flex flex-col gap-1">
            <label className="font-label-caps text-[12px] uppercase tracking-widest text-on-surface-variant">URL Slug</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-outline font-mono text-[14px]">/posts/</span>
              <input
                className="w-full bg-surface border border-outline-variant rounded-lg py-2 pl-[70px] pr-3 font-mono text-[14px] text-on-surface focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary transition-all"
                type="text"
                value={slug || `${date.split('T')[0]}-${title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "")}`}
                onChange={e => setSlug(e.target.value)}
                disabled={fetching}
              />
            </div>
          </div>

          {/* Publish Date */}
          <div className="flex flex-col gap-1">
            <label className="font-label-caps text-[12px] uppercase tracking-widest text-on-surface-variant">Publish Date</label>
            <div className="relative">
              <input
                className="w-full bg-surface border border-outline-variant rounded-lg px-3 py-2 font-body-md text-[15px] text-on-surface focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary transition-all"
                type="datetime-local"
                value={date}
                onChange={e => setDate(e.target.value)}
                disabled={fetching}
              />
            </div>
          </div>

          {/* Tags */}
          <div className="flex flex-col gap-[8px]">
            <label className="font-label-caps text-[12px] uppercase tracking-widest text-on-surface-variant">Tags (comma separated)</label>
            <input
              className="w-full bg-surface border border-outline-variant rounded-lg px-3 py-2 font-body-md text-[15px] text-on-surface focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary transition-all"
              placeholder="e.g. tech, design"
              type="text"
              value={tags}
              onChange={e => setTags(e.target.value)}
              disabled={fetching}
            />
          </div>

          <div className="h-[1px] w-full bg-outline-variant my-1"></div>

          {/* Featured Image */}
          <div className="flex flex-col gap-[8px]">
            <label className="font-label-caps text-[12px] uppercase tracking-widest text-on-surface-variant">Featured Image</label>
            <div
              className="border-2 border-dashed border-outline-variant rounded-lg p-[16px] flex flex-col items-center justify-center gap-2 bg-surface hover:bg-surface-container-high transition-colors cursor-pointer group overflow-hidden"
              onClick={() => featuredImageInputRef.current?.click()}
            >
              <input type="file" ref={featuredImageInputRef} style={{ display: 'none' }} onChange={handleFeaturedImageUpload} accept="image/*" />
              {featuredImage ? (
                <img src={featuredImage} alt="Featured" className="w-full h-auto max-h-[150px] object-contain rounded" />
              ) : (
                <>
                  <div className="w-10 h-10 rounded-full bg-surface-container-highest flex items-center justify-center group-hover:bg-primary group-hover:text-on-primary transition-colors">
                    <span className="material-symbols-outlined" data-icon="add_photo_alternate">add_photo_alternate</span>
                  </div>
                  <span className="font-body-md text-[13px] text-on-surface-variant text-center">Click to upload</span>
                </>
              )}
            </div>
          </div>

          {/* Layout Template */}
          <div className="flex flex-col gap-1 mt-[8px]">
            <label className="font-label-caps text-[12px] uppercase tracking-widest text-on-surface-variant">Layout Template</label>
            <select
              className="w-full bg-surface border border-outline-variant rounded-lg px-3 py-2 font-body-md text-[15px] text-on-surface focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary transition-all appearance-none cursor-pointer"
              value={layout}
              onChange={e => setLayout(e.target.value)}
            >
              <option>Single Post (Default)</option>
              <option>Full Width Hero</option>
              <option>Documentation Article</option>
            </select>
          </div>
        </div>
      )}
    </aside>
  );
}
