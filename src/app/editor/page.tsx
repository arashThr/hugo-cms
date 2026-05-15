"use client";

import { useEditor, EditorContent } from '@tiptap/react';
import { BubbleMenu } from '@tiptap/react/menus';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import LinkExtension from '@tiptap/extension-link';
import { Markdown } from 'tiptap-markdown';
import { useState, useRef, useEffect, Suspense } from 'react';
import { useSettings } from '@/components/SettingsProvider';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { EditorSidebar } from '@/components/editor/EditorSidebar';
import { ImageSizeModal } from '@/components/editor/ImageSizeModal';
import { DraftCancelModal } from '@/components/editor/DraftCancelModal';
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

  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const [initializedPath, setInitializedPath] = useState<string | null | undefined>(undefined);

  const imagesRef = useRef(images);
  useEffect(() => { imagesRef.current = images; }, [images]);
  const settingsRef = useRef(settings);
  useEffect(() => { settingsRef.current = settings; }, [settings]);

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
      LinkExtension.configure({
        openOnClick: false,
        HTMLAttributes: {
          target: null,
          rel: null,
        },
      }),
      Markdown,
    ],
    content: '',
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: "font-body-lg text-[18px] text-on-surface min-h-[600px] outline-none leading-relaxed",
      },
      handleClick: (view, pos, event) => {
        let el = event.target as HTMLElement;
        while (el && el !== view.dom) {
          if (el.tagName === 'A') {
            event.preventDefault();
            return false;
          }
          el = el.parentElement as HTMLElement;
        }
        return false;
      }
    },
    onUpdate: ({ editor }) => {
      if (viewMode === 'rich') {
        // @ts-ignore
        const rawMd = editor.storage.markdown.getMarkdown();
        setMarkdown(processMarkdownForSave(rawMd, imagesRef.current, settingsRef.current.repository));
      }
    }
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

  const processMarkdownForSave = (md: string, currentImages: typeof images, repo?: string) => {
    const repository = repo || settings.repository;
    if (!repository) return md;
    let processed = md;
    const [owner, project] = repository.split("/");

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

  const resetToEmpty = () => {
    setTitle('');
    setDate(new Date().toISOString().slice(0, 16));
    setTags('');
    setSlug('');
    setLayout('Single Post (Default)');
    setMarkdown('');
    setImages([]);
    editor?.commands.setContent('');
  };

  useEffect(() => {
    if (!editor || !settings.repository || fetching) return;
    if (initializedPath === editPath) return;

    if (editPath) {
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

              const layoutMatch = fm.match(/layout\s*[:=]\s*["']?(.*?)["']?(?:\r?\n|$)/i);
              if (layoutMatch) setLayout(layoutMatch[1]);

              const imageMatch = fm.match(/image\s*[:=]\s*["']?(.*?)["']?(?:\r?\n|$)/i);
              if (imageMatch) setFeaturedImage(imageMatch[1]);

              const filename = editPath.split("/").pop()?.replace('.md', '');
              if (filename) setSlug(filename);

              const cleanMd = md.replace(/^\s+/, '');
              setMarkdown(cleanMd);
              if (viewMode === 'rich') {
                editor.commands.setContent(processMarkdownForEditor(cleanMd, imagesRef.current));
              }
            } else {
              setMarkdown(content);
              if (viewMode === 'rich') {
                editor.commands.setContent(processMarkdownForEditor(content, imagesRef.current));
              }
            }
          }
        } catch (e) {
          console.error("Failed to fetch post", e);
        } finally {
          setFetching(false);
          setInitializedPath(editPath);
        }
      };

      fetchPost();
    } else {
      // New post initialization
      const draftStr = localStorage.getItem('hugo_draft');
      if (draftStr) {
        try {
          const draft = JSON.parse(draftStr);
          if (window.confirm("You have an unsaved draft. Do you want to restore it?")) {
            setTitle(draft.title || '');
            setDate(draft.date || new Date().toISOString().slice(0, 16));
            setTags(draft.tags || '');
            setSlug(draft.slug || '');
            setLayout(draft.layout || 'Single Post (Default)');
            setFeaturedImage(draft.featuredImage || null);
            setMarkdown(draft.markdown || '');
            setImages(draft.images || []);
            editor.commands.setContent(processMarkdownForEditor(draft.markdown || '', draft.images || []));
          } else {
            localStorage.removeItem('hugo_draft');
            resetToEmpty();
          }
        } catch (e) {
          localStorage.removeItem('hugo_draft');
          resetToEmpty();
        }
      } else {
        resetToEmpty();
      }
      setInitializedPath(editPath);
    }
  }, [editPath, settings.repository, editor, initializedPath, fetching]);

  useEffect(() => {
    if (editPath === null && initializedPath === null) {
      const hasChanges = title || markdown || tags || slug;
      if (hasChanges) {
        const draft = { title, date, tags, slug, layout, markdown, images, featuredImage };
        localStorage.setItem('hugo_draft', JSON.stringify(draft));
      }
    }
  }, [title, date, tags, slug, layout, markdown, images, featuredImage, editPath, initializedPath]);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      const hasChanges = title || markdown || tags || slug;
      if (hasChanges && !publishing) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [title, markdown, tags, slug, publishing]);

  // Prevent default link clicks within the editor natively
  useEffect(() => {
    const handleLinkClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest('.ProseMirror a')) {
        e.preventDefault();
      }
    };
    document.addEventListener('click', handleLinkClick, { capture: true });
    return () => document.removeEventListener('click', handleLinkClick, { capture: true });
  }, []);

  const handleCancel = (e: React.MouseEvent) => {
    e.preventDefault();
    const hasChanges = title || markdown || tags || slug;
    if (hasChanges && !publishing) {
      if (!editPath) {
        setShowCancelModal(true);
      } else {
        if (window.confirm("You have unsaved changes. Are you sure you want to leave?")) {
          router.push('/');
        }
      }
    } else {
      router.push('/');
    }
  };

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
          slug: slug || `${date.split('T')[0]}-${title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "")}`,
          layout,
          date,
          tags,
          markdown: finalMarkdown,
          images,
          featuredImage
        })
      });

      const data = await res.json();
      if (data.success) {
        if (!editPath) {
          localStorage.removeItem('hugo_draft');
        }
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
          <button onClick={handleCancel} className="text-on-surface-variant hover:text-on-surface transition-colors flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined" data-icon="arrow_back">arrow_back</span>
          </button>
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

          <button onClick={handleCancel} className="hidden md:block font-body-md text-[15px] text-on-surface-variant hover:bg-surface-container px-4 py-2 rounded-lg transition-colors">
            Cancel
          </button>

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
                prose-code:bg-surface-container-high prose-code:px-1 prose-code:rounded
                prose-pre:bg-surface-container-highest prose-pre:text-on-surface
                [&_.ProseMirror]:min-h-[500px]
                [&_.ProseMirror]:outline-none
                overflow-y-auto
                hide-scrollbar
              ">
                {editor && (
                  <BubbleMenu editor={editor} shouldShow={({ editor }) => editor.isActive('link')}>
                    <div className="flex items-center bg-surface-container shadow-md rounded-md overflow-hidden border border-outline-variant text-on-surface text-[13px] font-body-md p-1 gap-1">
                      {editor.isActive('link') && (
                        <>
                          <button onClick={() => {
                            const currentHref = editor.getAttributes('link').href;
                            const url = window.prompt('URL', currentHref);
                            if (url === null) return;
                            if (url === '') {
                              editor.chain().focus().extendMarkRange('link').unsetLink().run();
                              return;
                            }
                            editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
                          }} className="px-3 py-1 hover:bg-surface-container-high rounded transition-colors whitespace-nowrap">
                            Edit Link
                          </button>
                          <button onClick={() => editor.chain().focus().unsetLink().run()} className="px-3 py-1 hover:bg-surface-container-high rounded transition-colors text-red-600 whitespace-nowrap">
                            Remove Link
                          </button>
                        </>
                      )}

                    </div>
                  </BubbleMenu>
                )}
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
        <EditorSidebar 
          slug={slug}
          setSlug={setSlug}
          title={title}
          date={date}
          setDate={setDate}
          tags={tags}
          setTags={setTags}
          featuredImage={featuredImage}
          handleFeaturedImageUpload={handleFeaturedImageUpload}
          featuredImageInputRef={featuredImageInputRef}
          layout={layout}
          setLayout={setLayout}
          fetching={fetching}
          showSidebar={showSidebar}
          setShowSidebar={setShowSidebar}
        />
      </main>

      {/* Image Size Selection Modal */}
      <ImageSizeModal 
        pendingImage={pendingImage}
        compressing={compressing}
        confirmImageUpload={confirmImageUpload}
        setPendingImage={setPendingImage}
      />

      {/* Draft Cancel Modal */}
      <DraftCancelModal 
        showCancelModal={showCancelModal}
        setShowCancelModal={setShowCancelModal}
      />
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
