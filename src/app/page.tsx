"use client";

import { useSession } from "next-auth/react";
import { useSettings } from "@/components/SettingsProvider";
import { useEffect, useState } from "react";
import Link from "next/link";
import { FileText, Plus, Settings, Check, Search } from "lucide-react";
import styles from "./page.module.css";

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

  useEffect(() => {
    if (session && !settings.repository) {
      fetchRepos();
    } else if (session && settings.repository) {
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
    return <div className={styles.loading}>Loading...</div>;
  }

  if (!session) {
    return (
      <div className={styles.hero}>
        <h1>Your Hugo Blog, Anywhere.</h1>
        <p>A beautiful, rich-text CMS for your static site. Login with GitHub to get started.</p>
      </div>
    );
  }

  if (!settings.repository || showSettings) {
    return (
      <div className={styles.settingsContainer}>
        <h2>{showSettings ? "Settings" : "Select Repository"}</h2>
        <p className={styles.description}>
          Choose the GitHub repository where your Hugo site is hosted.
        </p>
        
        {loadingRepos ? (
          <div className={styles.loading}>Loading your repositories...</div>
        ) : (
          <div className={styles.repoList}>
            {repos.map((repo) => (
              <button
                key={repo.id}
                className={`${styles.repoItem} ${settings.repository === repo.full_name ? styles.selected : ""}`}
                onClick={() => {
                  updateSettings({ repository: repo.full_name });
                  setShowSettings(false);
                }}
              >
                <span className={styles.repoName}>{repo.full_name}</span>
                {settings.repository === repo.full_name && <Check size={16} className={styles.checkIcon} />}
              </button>
            ))}
          </div>
        )}

        <div className={styles.configSection}>
          <h3>Advanced Configuration</h3>
          <div className={styles.inputGroup}>
            <label>Content Path (where markdown posts are saved)</label>
            <input 
              type="text" 
              value={settings.contentPath}
              onChange={(e) => updateSettings({ contentPath: e.target.value })}
              className={styles.input}
            />
          </div>
          <div className={styles.inputGroup}>
            <label>Image Path (where uploaded images are saved)</label>
            <input 
              type="text" 
              value={settings.imagePath}
              onChange={(e) => updateSettings({ imagePath: e.target.value })}
              className={styles.input}
            />
          </div>
        </div>

        {showSettings && (
          <button className="button" onClick={() => setShowSettings(false)}>
            Done
          </button>
        )}
      </div>
    );
  }

  // Filter tree to show only files in contentPath
  const allPosts = tree.filter((item) => 
    item.path.startsWith(settings.contentPath) && 
    item.type === "blob" && 
    item.path.endsWith(".md")
  ).sort((a, b) => b.path.localeCompare(a.path));

  const filteredPosts = allPosts.filter(post => 
    post.path.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  const visiblePosts = filteredPosts.slice(0, visibleCount);

  return (
    <div className={styles.dashboard}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Your Posts</h1>
          <p className={styles.subtitle}>Managing <strong>{settings.repository}</strong></p>
        </div>
        <div className={styles.actions}>
          <button className="button button-outline" onClick={() => setShowSettings(true)}>
            <Settings size={16} />
          </button>
          <Link href="/editor" className="button" style={{ whiteSpace: 'nowrap' }}>
            <Plus size={16} />
            New Post
          </Link>
        </div>
      </header>
      
      <div className={styles.searchContainer}>
        <Search size={18} className={styles.searchIcon} />
        <input 
          type="text" 
          placeholder="Search posts..." 
          className={styles.searchInput}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {loadingTree ? (
        <div className={styles.loading}>Loading posts...</div>
      ) : allPosts.length === 0 ? (
        <div className={styles.emptyState}>
          <FileText size={48} className={styles.emptyIcon} />
          <h3>No posts found</h3>
          <p>We couldn't find any markdown files in <code>{settings.contentPath}</code>.</p>
          <Link href="/editor" className="button">Create your first post</Link>
        </div>
      ) : (
        <>
          {filteredPosts.length === 0 ? (
             <div className={styles.emptyState}>
               <p>No posts match your search.</p>
             </div>
          ) : (
            <div className={styles.postList}>
              {visiblePosts.map((post) => {
                const filename = post.path.split("/").pop() || post.path;
                return (
                  <Link href={`/editor?path=${encodeURIComponent(post.path)}`} key={post.sha} className={styles.postItem}>
                    <FileText size={20} className={styles.postIcon} />
                    <span className={styles.postName}>{filename}</span>
                  </Link>
                );
              })}
            </div>
          )}
          
          {visiblePosts.length < filteredPosts.length && (
            <div className={styles.loadMoreContainer}>
              <button 
                className="button button-outline" 
                onClick={() => setVisibleCount(v => v + 20)}
              >
                Show More
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
