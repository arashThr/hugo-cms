"use client";

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import LinkExtension from '@tiptap/extension-link';
import { Markdown } from 'tiptap-markdown';
import { useState, useRef, useEffect, Suspense } from 'react';
import { useSettings } from '@/components/SettingsProvider';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';

function EditorForm() {
  const { data: session } = useSession();
  const { settings, isLoaded } = useSettings();
  const router = useRouter();
  const searchParams = useSearchParams();
  const editPath = searchParams.get('path');

  const [title, setTitle] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 16));
  const [tags, setTags] = useState('');

  // Extra states for the new design
  const [slug, setSlug] = useState('');
  const [layout, setLayout] = useState('Single Post (Default)');

  const [markdown, setMarkdown] = useState('');
  const [images, setImages] = useState<{ name: string, base64: string, markdownPath: string }[]>([]);
  const [publishing, setPublishing] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [viewMode, setViewMode] = useState<'markdown' | 'rich'>('rich');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const featuredImageInputRef = useRef<HTMLInputElement>(null);
  const [featuredImage, setFeaturedImage] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [pendingImage, setPendingImage] = useState<{ file: File, type: 'inline' | 'featured' } | null>(null);
  const [compressing, setCompressing] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Image,
      Markdown,
      LinkExtension.configure({
        openOnClick: false,
      }),
    ],
    content: '',
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: "font-body-lg text-[18px] text-on-surface min-h-[600px] outline-none leading-relaxed",
      },
    },
  });

  const processMarkdownForEditor = (md: string, currentImages: typeof images) => {
    if (!settings.repository) return md;
    let processed = md;

    currentImages.forEach(img => {
      processed = processed.split(img.markdownPath).join(img.base64);
    });

    const [owner, repo] = settings.repository.split("/");
    processed = processed.replace(/!\[(.*?)\]\((.*?)\)/g, (match, alt, src) => {
      if (src.startsWith('http') || src.startsWith('data:')) return match;
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

    const githubPrefix = `https://raw.githubusercontent.com/${owner}/${repo}/main/static`;
    processed = processed.split(githubPrefix).join('');

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
                } catch (e) { }
              }

              const tagsMatch = fm.match(/tags\s*[:=]\s*\[(.*?)\]/i);
              if (tagsMatch) {
                const rawTags = tagsMatch[1].replace(/["']/g, "").split(",").map((t: string) => t.trim()).join(", ");
                setTags(rawTags);
              }

              // Set Slug based on filename if editing
              const filename = editPath.split("/").pop()?.replace('.md', '');
              if (filename) setSlug(filename);

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
        } catch (e) {
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

  const resizeImage = (file: File, maxWidth: number): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new window.Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            resolve(canvas.toDataURL('image/webp', 0.8));
          } else {
            resolve(e.target?.result as string); // fallback
          }
        };
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setPendingImage({ file, type: 'inline' });
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleFeaturedImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setPendingImage({ file, type: 'featured' });
    if (featuredImageInputRef.current) featuredImageInputRef.current.value = '';
  };

  const confirmImageUpload = async (maxWidth: number) => {
    if (!pendingImage) return;
    setCompressing(true);
    const { file, type } = pendingImage;
    const base64 = await resizeImage(file, maxWidth);

    if (type === 'featured') {
      setFeaturedImage(base64);
    } else {
      const filename = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
      const imageMarkdownPath = `/${settings.imagePath.replace(/^static\//, '')}/${filename}`.replace(/\/\//g, '/');

      setImages(prev => {
        const newImages = [...prev, { name: filename, base64, markdownPath: imageMarkdownPath }];

        if (viewMode === 'rich' && editor) {
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
    }
    setPendingImage(null);
    setCompressing(false);
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
    <div className="bg-background text-on-background font-body-md h-screen flex flex-col overflow-hidden antialiased">
      {/* Transactional Top Bar */}
      <header className="flex justify-between items-center h-16 px-4 md:px-6 border-b border-outline-variant bg-surface-container-lowest shrink-0 z-10 gap-2 overflow-hidden">
        <div className="flex items-center gap-2 md:gap-4 min-w-0">
          <Link href="/" className="text-on-surface-variant hover:text-on-surface transition-colors flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined" data-icon="arrow_back">arrow_back</span>
          </Link>
          <div className="h-4 w-[1px] bg-outline-variant shrink-0"></div>
          <div className="font-body-md text-[15px] text-on-surface-variant flex items-center gap-1 min-w-0">
            <span className="hidden md:inline shrink-0">{editPath ? 'Editing:' : 'New:'}</span>
            <strong className="text-on-surface font-semibold truncate max-w-[120px] md:max-w-[300px]">{title || 'Untitled'}</strong>
          </div>
        </div>
        <div className="flex items-center gap-2 md:gap-[16px] shrink-0">
          {/* Status Indicator */}
          {fetching && (
            <div className="flex items-center gap-xs px-2 md:px-3 py-1.5 rounded-full bg-surface-container text-on-surface-variant font-label-caps text-[10px] md:text-[12px] uppercase tracking-widest shrink-0">
              <span className="w-2 h-2 rounded-full bg-outline animate-pulse shrink-0"></span>
              <span className="hidden md:inline">LOADING</span>
            </div>
          )}

          <div className="hidden md:block h-6 w-[1px] bg-outline-variant mx-1"></div>

          <Link href="/" className="hidden md:block font-body-md text-[15px] text-on-surface-variant hover:bg-surface-container px-4 py-2 rounded-lg transition-colors">
            Cancel
          </Link>

          <button
            onClick={publish}
            disabled={publishing || !title || fetching}
            className="font-body-md text-[13px] md:text-[15px] bg-primary text-on-primary hover:opacity-90 px-3 md:px-5 py-2 rounded-lg transition-opacity flex items-center gap-1 shadow-sm disabled:opacity-50 shrink-0"
          >
            <span className="hidden md:inline">{publishing ? 'Publishing...' : 'Publish'}</span>
            <span className="md:hidden">{publishing ? 'Wait...' : 'Publish'}</span>
            {!publishing && <span className="material-symbols-outlined text-[16px] md:text-[18px]" data-icon="send">send</span>}
          </button>
        </div>
      </header>

      {/* Main Workspace */}
      <main className="flex flex-1 overflow-y-auto lg:overflow-hidden relative flex-col lg:flex-row">
        {/* Editor Canvas */}
        <section className="flex-1 lg:overflow-y-auto flex justify-center py-[24px] lg:py-[48px] relative scroll-smooth w-full">
          <div className="w-[800px] max-w-full px-[24px] flex flex-col gap-[24px] pb-[48px]">
            {/* Document Title */}
            <input
              className="shrink-0 font-headline-xl text-[36px] font-bold text-on-surface bg-transparent border-none focus:ring-0 p-0 placeholder:text-outline-variant w-full outline-none"
              placeholder="Post Title"
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              disabled={fetching}
            />

            {/* IDE-Style Toolbar */}
            <div className="shrink-0 sticky top-0 z-20 w-full flex items-center p-1 border border-outline-variant rounded-lg bg-surface-container-lowest/90 backdrop-blur-sm shadow-sm transition-all overflow-x-auto gap-2 hide-scrollbar">
              {/* Formatting Tools */}
              <div className="flex items-center gap-1 shrink-0">
                {viewMode === 'rich' ? (
                  <>
                    <button onClick={() => editor?.chain().focus().toggleBold().run()} className={`p-2 rounded transition-colors shrink-0 ${editor?.isActive('bold') ? 'bg-surface-container text-on-surface' : 'hover:bg-surface-container text-on-surface-variant'}`}><span className="material-symbols-outlined" data-icon="format_bold">format_bold</span></button>
                    <button onClick={() => editor?.chain().focus().toggleItalic().run()} className={`p-2 rounded transition-colors shrink-0 ${editor?.isActive('italic') ? 'bg-surface-container text-on-surface' : 'hover:bg-surface-container text-on-surface-variant'}`}><span className="material-symbols-outlined" data-icon="format_italic">format_italic</span></button>
                    <button onClick={() => editor?.chain().focus().toggleStrike().run()} className={`p-2 rounded transition-colors shrink-0 ${editor?.isActive('strike') ? 'bg-surface-container text-on-surface' : 'hover:bg-surface-container text-on-surface-variant'}`}><span className="material-symbols-outlined" data-icon="strikethrough_s">strikethrough_s</span></button>
                    <div className="w-[1px] h-4 bg-outline-variant mx-1 shrink-0"></div>
                    <button onClick={() => fileInputRef.current?.click()} className="p-2 rounded hover:bg-surface-container text-on-surface-variant transition-colors shrink-0"><span className="material-symbols-outlined" data-icon="image">image</span></button>
                    <div className="w-[1px] h-4 bg-outline-variant mx-1 shrink-0"></div>
                    <button onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()} className={`p-2 rounded transition-colors font-bold shrink-0 ${editor?.isActive('heading', { level: 2 }) ? 'bg-surface-container text-on-surface' : 'hover:bg-surface-container text-on-surface-variant'}`}>H2</button>
                    <button onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()} className={`p-2 rounded transition-colors font-bold shrink-0 ${editor?.isActive('heading', { level: 3 }) ? 'bg-surface-container text-on-surface' : 'hover:bg-surface-container text-on-surface-variant'}`}>H3</button>
                    <div className="w-[1px] h-4 bg-outline-variant mx-1 shrink-0"></div>
                    <button onClick={() => editor?.chain().focus().toggleBulletList().run()} className={`p-2 rounded transition-colors shrink-0 ${editor?.isActive('bulletList') ? 'bg-surface-container text-on-surface' : 'hover:bg-surface-container text-on-surface-variant'}`}><span className="material-symbols-outlined" data-icon="format_list_bulleted">format_list_bulleted</span></button>
                    <button onClick={() => editor?.chain().focus().toggleBlockquote().run()} className={`p-2 rounded transition-colors shrink-0 ${editor?.isActive('blockquote') ? 'bg-surface-container text-on-surface' : 'hover:bg-surface-container text-on-surface-variant'}`}><span className="material-symbols-outlined" data-icon="format_quote">format_quote</span></button>
                  </>
                ) : (
                  <>
                    <button onClick={() => fileInputRef.current?.click()} className="p-2 rounded hover:bg-surface-container text-on-surface-variant transition-colors flex items-center gap-1 shrink-0">
                      <span className="material-symbols-outlined text-[16px]" data-icon="image">image</span>
                      <span className="text-[13px] font-medium">Insert Image</span>
                    </button>
                  </>
                )}

                <input
                  type="file"
                  accept="image/*"
                  ref={fileInputRef}
                  style={{ display: 'none' }}
                  onChange={handleImageUpload}
                />
              </div>

              {/* Dual Mode Toggle */}
              <div className="flex items-center p-1 bg-surface-container rounded-md border border-outline-variant/50 shrink-0 ml-auto">
                <button
                  onClick={() => toggleView('markdown')}
                  className={`px-3 py-1 rounded font-label-caps text-[12px] uppercase tracking-widest transition-colors flex items-center gap-1 ${viewMode === 'markdown' ? 'bg-surface-container-lowest text-on-surface shadow-sm border border-outline-variant/30' : 'text-on-surface-variant hover:text-on-surface'}`}
                >
                  <span className="material-symbols-outlined text-[16px]" data-icon="markdown">markdown</span>
                  <span className="hidden sm:inline">MARKDOWN</span>
                  <span className="sm:hidden">MD</span>
                </button>
                <button
                  onClick={() => toggleView('rich')}
                  className={`px-3 py-1 rounded font-label-caps text-[12px] uppercase tracking-widest transition-colors flex items-center gap-1 ${viewMode === 'rich' ? 'bg-surface-container-lowest text-on-surface shadow-sm border border-outline-variant/30' : 'text-on-surface-variant hover:text-on-surface'}`}
                >
                  <span className="material-symbols-outlined text-[16px]" data-icon="view_headline">view_headline</span>
                  <span className="hidden sm:inline">RICH TEXT</span>
                  <span className="sm:hidden">RICH</span>
                </button>
              </div>
            </div>

            {/* Content Area */}
            {fetching ? (
              <div className="py-12 flex justify-center text-on-surface-variant">Loading content...</div>
            ) : viewMode === 'rich' ? (
              <div className="
                prose prose-neutral dark:prose-invert max-w-none
                prose-headings:font-semibold
                prose-h1:text-3xl
                prose-h2:text-2xl
                prose-h3:text-xl
                prose-p:text-base
                prose-a:text-blue-600 hover:prose-a:text-blue-500
                prose-blockquote:border-l-4 prose-blockquote:pl-4 prose-blockquote:text-gray-500
                prose-code:bg-gray-100 prose-code:px-1 prose-code:rounded
                prose-pre:bg-gray-900 prose-pre:text-gray-100
                [&_.ProseMirror]:min-h-[500px]
                [&_.ProseMirror]:outline-none
                overflow-y-auto
                hide-scrollbar
              ">
                <EditorContent editor={editor} />
              </div>
            ) : (
              <textarea
                ref={textareaRef}
                className="w-full min-h-[600px] border-none bg-transparent outline-none resize-y font-mono text-[14px] leading-[1.6] text-on-surface focus:ring-0 p-0"
                value={markdown}
                onChange={(e) => setMarkdown(e.target.value)}
                placeholder="Write your markdown here..."
              />
            )}
          </div>
        </section>

        {/* Right Sidebar (Front Matter / Metadata) */}
        <aside className="w-full lg:w-80 border-t lg:border-t-0 lg:border-l border-outline-variant bg-surface-container-lowest shrink-0 lg:overflow-y-auto flex flex-col shadow-[-4px_0_24px_rgba(0,0,0,0.02)]">
          <div className="p-[16px] border-b border-outline-variant flex items-center justify-between sticky top-0 bg-surface-container-lowest/95 backdrop-blur z-10">
            <h2 className="font-label-caps text-[12px] uppercase tracking-widest text-on-surface-variant">Post Metadata</h2>
            <button className="text-on-surface-variant hover:text-on-surface"><span className="material-symbols-outlined text-[20px]" data-icon="tune">tune</span></button>
          </div>

          <div className="p-[24px] flex flex-col gap-[24px]">
            {/* URL Slug */}
            <div className="flex flex-col gap-1">
              <label className="font-label-caps text-[12px] uppercase tracking-widest text-on-surface-variant">URL Slug</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-outline font-mono text-[14px]">/posts/</span>
                <input
                  className="w-full bg-surface border border-outline-variant rounded-lg py-2 pl-[70px] pr-3 font-mono text-[14px] text-on-surface focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary transition-all"
                  type="text"
                  value={slug || title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "")}
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
        </aside>
      </main>

      {/* Image Size Selection Modal */}
      {pendingImage && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest rounded-xl p-[24px] max-w-sm w-full border border-outline-variant shadow-xl flex flex-col gap-[16px]">
            <h3 className="font-headline-md text-[20px] text-primary">Select Image Size</h3>
            <p className="font-body-md text-[14px] text-on-surface-variant">
              Choose an optimized size for your image before uploading.
            </p>
            <div className="flex flex-col gap-2 mt-2">
              <button onClick={() => confirmImageUpload(300)} disabled={compressing} className="w-full text-left px-4 py-3 border border-outline-variant rounded-lg hover:bg-surface-container transition-colors flex justify-between items-center group disabled:opacity-50">
                <span className="font-body-md font-medium text-on-surface">Small</span>
                <span className="font-mono text-[12px] text-on-surface-variant group-hover:text-primary transition-colors">Max 300px</span>
              </button>
              <button onClick={() => confirmImageUpload(600)} disabled={compressing} className="w-full text-left px-4 py-3 border border-outline-variant rounded-lg hover:bg-surface-container transition-colors flex justify-between items-center group disabled:opacity-50">
                <span className="font-body-md font-medium text-on-surface">Medium</span>
                <span className="font-mono text-[12px] text-on-surface-variant group-hover:text-primary transition-colors">Max 600px</span>
              </button>
              <button onClick={() => confirmImageUpload(960)} disabled={compressing} className="w-full text-left px-4 py-3 border border-outline-variant rounded-lg hover:bg-surface-container transition-colors flex justify-between items-center group disabled:opacity-50">
                <span className="font-body-md font-medium text-on-surface">Large</span>
                <span className="font-mono text-[12px] text-on-surface-variant group-hover:text-primary transition-colors">Max 960px</span>
              </button>
            </div>
            <div className="flex justify-end mt-2">
              <button onClick={() => setPendingImage(null)} disabled={compressing} className="font-label-caps text-[12px] uppercase tracking-widest px-4 py-2 text-on-surface-variant hover:bg-surface-container rounded-lg transition-colors disabled:opacity-50">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function EditorPage() {
  return (
    <Suspense fallback={<div className="flex h-screen w-full items-center justify-center text-on-surface-variant font-body-md">Loading editor...</div>}>
      <EditorForm />
    </Suspense>
  );
}
