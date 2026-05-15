import React from 'react';
import Link from 'next/link';

interface PostsListProps {
  settings: any;
  searchQuery: string;
  setSearchQuery: (s: string) => void;
  sortOrder: string;
  setSortOrder: (s: string) => void;
  loadingTree: boolean;
  filteredPosts: any[];
  visiblePosts: any[];
  loadMore: () => void;
}

export function PostsList({
  settings,
  searchQuery,
  setSearchQuery,
  sortOrder,
  setSortOrder,
  loadingTree,
  filteredPosts,
  visiblePosts,
  loadMore
}: PostsListProps) {
  return (
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
                <div className="col-span-8">Post Title</div>
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
              onClick={loadMore}
              className="px-4 py-2 border border-outline-variant text-primary rounded-lg hover:bg-surface-container transition-colors font-label-caps text-[12px] uppercase tracking-widest"
            >
              Load More
            </button>
        </div>
      )}
    </>
  );
}
