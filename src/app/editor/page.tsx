"use client";

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import { Markdown } from 'tiptap-markdown';
import { useState, useRef, useEffect, Suspense } from 'react';
import { useSettings } from '@/components/SettingsProvider';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { ArrowLeft, Image as ImageIcon, Loader2 } from 'lucide-react';
import Link from 'next/link';
import styles from './editor.module.css';

function EditorForm() {
  const { data: session } = useSession();
  const { settings, isLoaded } = useSettings();
  const router = useRouter();
  const searchParams = useSearchParams();
  const editPath = searchParams.get('path');

  const [title, setTitle] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 16));
  const [tags, setTags] = useState('');
  const [markdown, setMarkdown] = useState('');
  const [images, setImages] = useState<{name: string, base64: string, markdownPath: string}[]>([]);
  const [publishing, setPublishing] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [viewMode, setViewMode] = useState<'markdown' | 'rich'>('rich');
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Image,
      Markdown,
    ],
    content: '',
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: styles.prose,
      },
    },
  });

  const processMarkdownForEditor = (md: string, currentImages: typeof images) => {
    if (!settings.repository) return md;
    let processed = md;
    
    // 1. Replace new uploaded images (markdown paths) with their base64 representation so TipTap can render them
    currentImages.forEach(img => {
      processed = processed.split(img.markdownPath).join(img.base64);
    });

    // 2. Replace old local images with absolute GitHub Raw URLs so they load in the browser
    const [owner, repo] = settings.repository.split("/");
    processed = processed.replace(/!\[(.*?)\]\((.*?)\)/g, (match, alt, src) => {
      if (src.startsWith('http') || src.startsWith('data:')) return match;
      
      // Assume local paths map to the 'static' folder in the repo
      const cleanSrc = src.startsWith('/') ? src : `/${src}`;
      const githubUrl = `https://raw.githubusercontent.com/${owner}/${repo}/main/static${cleanSrc}`;
      return `![${alt}](${githubUrl})`;
    });

    return processed;
  };

  const processMarkdownForSave = (md: string, currentImages: typeof images) => {
    if (!settings.repository) return md;
    let processed = md;
    const [owner, repo] = settings.repository.split("/");
    
    // 1. Revert github raw URLs back to local paths
    const githubPrefix = `https://raw.githubusercontent.com/${owner}/${repo}/main/static`;
    processed = processed.split(githubPrefix).join('');

    // 2. Revert base64 strings back to their proper markdown paths
    currentImages.forEach(img => {
      processed = processed.split(img.base64).join(img.markdownPath);
    });

    return processed;
  };

  useEffect(() => {
    if (isLoaded && !settings.repository) {
      router.push('/');
    }
  }, [isLoaded, settings.repository, router]);

  useEffect(() => {
    if (editPath && settings.repository && !fetching && editor && markdown === '') {
      const fetchPost = async () => {
        setFetching(true);
        const [owner, repo] = settings.repository.split("/");
        try {
          const res = await fetch(`/api/github/file?owner=${owner}&repo=${repo}&path=${encodeURIComponent(editPath)}`);
          const data = await res.json();
          if (data.content) {
            const content = data.content;
            const match = content.match(/^(?:\+\+\+|---)\r?\n([\s\S]*?)(?:\+\+\+|---)\r?\n([\s\S]*)$/);
            if (match) {
              const fm = match[1];
              const md = match[2];
              
              const titleMatch = fm.match(/title\s*[:=]\s*["']?(.*?)["']?(?:\r?\n|$)/i);
              if (titleMatch) setTitle(titleMatch[1]);
              
              const dateMatch = fm.match(/date\s*[:=]\s*["']?(.*?)["']?(?:\r?\n|$)/i);
              if (dateMatch && dateMatch[1]) {
                try {
                  setDate(new Date(dateMatch[1]).toISOString().slice(0, 16));
                } catch(e) {}
              }
              
              const tagsMatch = fm.match(/tags\s*[:=]\s*\[(.*?)\]/i);
              if (tagsMatch) {
                const rawTags = tagsMatch[1].replace(/["']/g, "").split(",").map((t: string) => t.trim()).join(", ");
                setTags(rawTags);
              }
              
              const cleanMd = md.replace(/^\s+/, '');
              setMarkdown(cleanMd);
              if (viewMode === 'rich') {
                editor.commands.setContent(processMarkdownForEditor(cleanMd, images));
              }
            } else {
              setMarkdown(content);
              if (viewMode === 'rich') {
                editor.commands.setContent(processMarkdownForEditor(content, images));
              }
            }
          }
        } catch(e) {
          console.error("Failed to fetch post", e);
        } finally {
          setFetching(false);
        }
      };
      
      fetchPost();
    }
  }, [editPath, settings.repository, editor]);

  const toggleView = (mode: 'markdown' | 'rich') => {
    if (mode === viewMode) return;
    
    if (mode === 'rich' && editor) {
      editor.commands.setContent(processMarkdownForEditor(markdown, images));
    } else if (mode === 'markdown' && editor) {
      // @ts-ignore
      const rawTipTapMd = editor.storage.markdown.getMarkdown();
      setMarkdown(processMarkdownForSave(rawTipTapMd, images));
    }
    setViewMode(mode);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target?.result as string;
        
        const filename = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
        const imageMarkdownPath = `/${settings.imagePath.replace(/^static\//, '')}/${filename}`.replace(/\/\//g, '/');
        
        setImages(prev => {
          const newImages = [...prev, { name: filename, base64, markdownPath: imageMarkdownPath }];
          
          if (viewMode === 'rich' && editor) {
            // Inject base64 visually so it renders, it will be reverted on save
            editor.chain().focus().setImage({ src: base64, alt: filename }).run();
          } else {
            const imageMarkdownString = `\n![${filename}](${imageMarkdownPath})\n`;
            if (textareaRef.current) {
              const textarea = textareaRef.current;
              const start = textarea.selectionStart;
              const end = textarea.selectionEnd;
              
              const newMarkdown = markdown.substring(0, start) + imageMarkdownString + markdown.substring(end);
              setMarkdown(newMarkdown);
              
              setTimeout(() => {
                textarea.focus();
                textarea.setSelectionRange(start + imageMarkdownString.length, start + imageMarkdownString.length);
              }, 0);
            } else {
              setMarkdown(prevMd => prevMd + imageMarkdownString);
            }
          }
          return newImages;
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const publish = async () => {
    if (!title) return;
    
    setPublishing(true);
    
    // @ts-ignore
    let finalMarkdown = viewMode === 'rich' ? processMarkdownForSave(editor?.storage.markdown.getMarkdown(), images) : markdown;
    
    try {
      const res = await fetch('/api/github/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          repository: settings.repository,
          contentPath: settings.contentPath,
          imagePath: settings.imagePath,
          title,
          date,
          tags,
          markdown: finalMarkdown,
          images
        })
      });
      
      const data = await res.json();
      if (data.success) {
        router.push('/');
      } else {
        alert("Failed to publish: " + data.error);
      }
    } catch (e: any) {
      alert("Error: " + e.message);
    } finally {
      setPublishing(false);
    }
  };

  if (!isLoaded || !settings.repository) return null;

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <Link href="/" className="button button-outline">
            <ArrowLeft size={16} /> Back
          </Link>
          <span className={styles.repoName}>{settings.repository}</span>
        </div>
        <button 
          className="button" 
          onClick={publish} 
          disabled={publishing || !title || fetching}
        >
          {publishing && <Loader2 size={16} className={styles.spin} />}
          {publishing ? 'Publishing...' : 'Publish Post'}
        </button>
      </header>

      <div className={styles.metaContainer}>
        <input 
          className={styles.titleInput} 
          placeholder="Post Title..." 
          value={title}
          onChange={e => setTitle(e.target.value)}
          disabled={fetching}
        />
        <div className={styles.metaGrid}>
          <div className={styles.inputGroup}>
            <label>Date</label>
            <input 
              type="datetime-local" 
              className={styles.input}
              value={date}
              onChange={e => setDate(e.target.value)}
              disabled={fetching}
            />
          </div>
          <div className={styles.inputGroup}>
            <label>Tags (comma separated)</label>
            <input 
              type="text" 
              className={styles.input}
              placeholder="e.g. tech, design"
              value={tags}
              onChange={e => setTags(e.target.value)}
              disabled={fetching}
            />
          </div>
        </div>
      </div>

      <div className={styles.editorContainer}>
        <div className={styles.toolbar}>
          {viewMode === 'rich' ? (
            <>
              <button 
                onClick={() => editor?.chain().focus().toggleBold().run()}
                className={`${styles.toolButton} ${editor?.isActive('bold') ? styles.active : ''}`}
                disabled={fetching}
              >Bold</button>
              <button 
                onClick={() => editor?.chain().focus().toggleItalic().run()}
                className={`${styles.toolButton} ${editor?.isActive('italic') ? styles.active : ''}`}
                disabled={fetching}
              >Italic</button>
              <button 
                onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
                className={`${styles.toolButton} ${editor?.isActive('heading', { level: 2 }) ? styles.active : ''}`}
                disabled={fetching}
              >H2</button>
              <button 
                onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()}
                className={`${styles.toolButton} ${editor?.isActive('heading', { level: 3 }) ? styles.active : ''}`}
                disabled={fetching}
              >H3</button>
              <button 
                onClick={() => editor?.chain().focus().toggleBulletList().run()}
                className={`${styles.toolButton} ${editor?.isActive('bulletList') ? styles.active : ''}`}
                disabled={fetching}
              >List</button>
            </>
          ) : (
            <span className={styles.toolbarLabel}>Markdown Source</span>
          )}
          
          <div className={styles.divider}></div>
          
          <button 
            onClick={() => fileInputRef.current?.click()}
            className={styles.toolButton}
            title="Insert Image"
            disabled={fetching}
          >
            <ImageIcon size={16} /> Insert Image
          </button>
          <input 
            type="file" 
            accept="image/*" 
            ref={fileInputRef}
            style={{ display: 'none' }}
            onChange={handleImageUpload}
          />
          
          <div className={styles.viewToggle}>
            <button 
              className={`${styles.toggleBtn} ${viewMode === 'rich' ? styles.active : ''}`}
              onClick={() => toggleView('rich')}
            >Rich Text</button>
            <button 
              className={`${styles.toggleBtn} ${viewMode === 'markdown' ? styles.active : ''}`}
              onClick={() => toggleView('markdown')}
            >Markdown</button>
          </div>
        </div>

        <div className={styles.editorWrapper}>
          {fetching ? (
            <div className={styles.loading}>Loading post content...</div>
          ) : viewMode === 'rich' ? (
            <EditorContent editor={editor} />
          ) : (
            <textarea
              ref={textareaRef}
              className={styles.rawTextarea}
              value={markdown}
              onChange={(e) => setMarkdown(e.target.value)}
              placeholder="Write your markdown here..."
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default function EditorPage() {
  return (
    <Suspense fallback={<div>Loading editor...</div>}>
      <EditorForm />
    </Suspense>
  );
}
