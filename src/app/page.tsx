"use client";

import { useSession, signOut } from "next-auth/react";
import { useSettings } from "@/components/SettingsProvider";
import { useEffect, useState } from "react";
import { LandingPage } from "@/components/dashboard/LandingPage";
import { SettingsView } from "@/components/dashboard/SettingsView";
import { SideNavBar } from "@/components/dashboard/SideNavBar";
import { MobileHeader } from "@/components/dashboard/MobileHeader";
import { PostsList } from "@/components/dashboard/PostsList";

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
    return <LandingPage />;
  }

  // --- Authenticated Repo Selection (Initial Setup) ---
  if (!settings.repository) {
    return (
      <div className="flex h-screen items-center justify-center bg-background p-6">
        <SettingsView 
          repos={repos}
          loadingRepos={loadingRepos}
          settings={settings}
          updateSettings={updateSettings}
          setShowSettings={setShowSettings}
          isInitialSetup={true}
        />
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
      <SideNavBar 
        session={session} 
        showSettings={showSettings} 
        setShowSettings={setShowSettings} 
        signOut={signOut} 
      />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col md:ml-64 bg-surface h-full overflow-hidden">
        {/* TopNavBar Mobile */}
        <MobileHeader 
          session={session} 
          setShowSettings={setShowSettings} 
          signOut={signOut} 
        />

        {/* Page Content Canvas */}
        <div className="flex-1 overflow-y-auto p-[24px] lg:p-[48px]">
            <div className="max-w-[1200px] mx-auto">
                {showSettings ? (
                  <SettingsView 
                    repos={repos}
                    loadingRepos={loadingRepos}
                    settings={settings}
                    updateSettings={updateSettings}
                    setShowSettings={setShowSettings}
                  />
                ) : (
                  <PostsList 
                    settings={settings}
                    searchQuery={searchQuery}
                    setSearchQuery={setSearchQuery}
                    sortOrder={sortOrder}
                    setSortOrder={setSortOrder}
                    loadingTree={loadingTree}
                    filteredPosts={filteredPosts}
                    visiblePosts={visiblePosts}
                    loadMore={() => setVisibleCount(v => v + 20)}
                  />
                )}
            </div>
        </div>
      </main>
    </div>
  );
}
