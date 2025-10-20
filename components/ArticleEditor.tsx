'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import type { Article, ContentBlock } from '../lib/types';
import { BlockType } from '../lib/types';
import { AudioRecorder } from './AudioRecorder';
import { BoldIcon, ItalicIcon, H2Icon, ImageIcon, MicIcon, DollarSignIcon, TextIcon, TrashIcon, SparklesIcon } from './icons';
import { generateText } from '../lib/gemini';

interface ArticleEditorProps {
    article: Article;
    onSave: (article: Article) => void;
    onClose: () => void;
}

const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = error => reject(error);
    });
};

const generateBlockId = () => {
    if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
        try {
            return crypto.randomUUID();
        } catch {
            // fall through to timestamp fallback
        }
    }
    return `block-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
};

export const ArticleEditor: React.FC<ArticleEditorProps> = ({ article: initialArticle, onSave, onClose }) => {
    const [article, setArticle] = useState<Article>(initialArticle);
    const [isSaving, setIsSaving] = useState(false);
    const [dragging, setDragging] = useState<string | null>(null);
    const draggingIdRef = useRef<string | null>(null);

    const [isAiModalOpen, setIsAiModalOpen] = useState(false);
    const [aiPrompt, setAiPrompt] = useState('');
    const [aiLoading, setAiLoading] = useState(false);
    const [activeTextBlockId, setActiveTextBlockId] = useState<string | null>(null);

    useEffect(() => {
        setArticle(initialArticle);
    }, [initialArticle]);

    const handleTitleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setArticle(prev => ({ ...prev, [name]: value }));
    }, []);

    const handleContentChange = useCallback((id: string, newContent: Partial<ContentBlock>) => {
        setArticle(prev => {
            let didUpdate = false;
            const updatedContent = prev.content.map(block => {
                if (block.id !== id) return block;
                didUpdate = true;
                return { ...block, ...newContent } as ContentBlock;
            });
            if (!didUpdate) return prev;
            return { ...prev, content: updatedContent };
        });
    }, []);

    const addBlock = useCallback((type: BlockType) => {
        let newBlock: ContentBlock;
        const id = generateBlockId();

        switch (type) {
            case BlockType.TEXT:
                newBlock = { id, type, content: '<p>Start writing here...</p>' };
                break;
            case BlockType.IMAGE:
                newBlock = { id, type, src: '', caption: '' };
                break;
            case BlockType.AUDIO:
                newBlock = { id, type, src: '', title: '' };
                break;
            case BlockType.SPONSORSHIP:
                newBlock = { id, type, company: '', logoSrc: '', link: '' };
                break;
            default:
                return;
        }

        setArticle(prev => ({ ...prev, content: [...prev.content, newBlock] }));
    }, []);

    const removeBlock = useCallback((id: string) => {
        setArticle(prev => {
            const updated = prev.content.filter(block => block.id !== id);
            if (updated.length === prev.content.length) return prev;
            return { ...prev, content: updated };
        });
    }, []);
    
    const handleDragStart = useCallback((e: React.DragEvent<HTMLDivElement>, id: string) => {
        draggingIdRef.current = id;
        setDragging(id);
        e.dataTransfer.effectAllowed = 'move';
    }, []);

    const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    }, []);

    const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>, dropId: string) => {
        e.preventDefault();
        const draggedId = draggingIdRef.current;
        if (!draggedId || draggedId === dropId) {
            setDragging(null);
            draggingIdRef.current = null;
            return;
        }

        setArticle(prev => {
            const originalIndex = prev.content.findIndex(b => b.id === draggedId);
            const newIndex = prev.content.findIndex(b => b.id === dropId);
            
            if (originalIndex === -1 || newIndex === -1) return prev;

            const newContent = [...prev.content];
            const [removed] = newContent.splice(originalIndex, 1);
            newContent.splice(newIndex, 0, removed);

            return { ...prev, content: newContent };
        });

        setDragging(null);
        draggingIdRef.current = null;
    }, []);

    const handleDragEnd = useCallback(() => {
        setDragging(null);
        draggingIdRef.current = null;
    }, []);

    const TextEditorToolbar: React.FC<{ blockId: string }> = ({ blockId }) => {
        const execCmd = (cmd: string, value?: string) => document.execCommand(cmd, false, value);
        
        const openAiModal = () => {
            setActiveTextBlockId(blockId);
            setIsAiModalOpen(true);
        };

        return (
            <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-white border border-stone-200 rounded-md shadow-lg p-1 flex items-center space-x-1 opacity-0 group-focus-within:opacity-100 transition-opacity">
                <button onClick={() => execCmd('bold')} className="p-2 hover:bg-stone-100 rounded"><BoldIcon className="w-4 h-4" /></button>
                <button onClick={() => execCmd('italic')} className="p-2 hover:bg-stone-100 rounded"><ItalicIcon className="w-4 h-4" /></button>
                <button onClick={() => execCmd('formatBlock', 'h2')} className="p-2 hover:bg-stone-100 rounded"><H2Icon className="w-4 h-4" /></button>
                <div className="w-px h-5 bg-stone-200 mx-1"></div>
                <button onClick={openAiModal} className="p-2 hover:bg-stone-100 rounded text-gold"><SparklesIcon className="w-4 h-4" /></button>
            </div>
        );
    };
    
    const handleGenerateWithAI = async () => {
        if (!aiPrompt || !activeTextBlockId) return;
        setAiLoading(true);
        const generatedHtml = await generateText(aiPrompt);
        handleContentChange(activeTextBlockId, { content: generatedHtml });
        setAiLoading(false);
        setIsAiModalOpen(false);
        setAiPrompt('');
        setActiveTextBlockId(null);
    };

    const AiModal = () => (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-lg">
                <h3 className="font-serif text-xl mb-4">Generate with AI</h3>
                <textarea
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    placeholder="e.g., Write a paragraph about the importance of heritage leather goods..."
                    className="w-full h-32 p-2 border border-stone-300 rounded-md focus:outline-none focus:ring-1 focus:ring-gold"
                />
                <div className="flex justify-end space-x-2 mt-4">
                    <button onClick={() => setIsAiModalOpen(false)} className="px-4 py-2 text-sm font-semibold text-stone-600 bg-stone-100 rounded-md hover:bg-stone-200">Cancel</button>
                    <button onClick={handleGenerateWithAI} disabled={aiLoading} className="px-4 py-2 text-sm font-semibold text-white bg-charcoal rounded-md hover:bg-stone-700 disabled:bg-stone-400">
                        {aiLoading ? 'Generating...' : 'Generate'}
                    </button>
                </div>
            </div>
        </div>
    );
    
    const handleHeroImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const base64 = await fileToBase64(e.target.files[0]);
            setArticle(prev => ({...prev, heroImage: base64}));
        }
    }

    const contentBlocks = useMemo(() => article.content, [article.content]);

    const handleSaveClick = useCallback(async () => {
        if (isSaving) return;
        setIsSaving(true);
        try {
            await onSave(article);
        } finally {
            setIsSaving(false);
        }
    }, [article, isSaving, onSave]);


    return (
        <div className="fixed inset-0 bg-cream z-40 overflow-y-auto p-4 md:p-8">
            {isAiModalOpen && <AiModal />}
            <div className="max-w-3xl mx-auto bg-white border border-stone-200 rounded-lg shadow-sm">
                <div className="p-6 border-b border-stone-200">
                    <input
                        type="text"
                        name="title"
                        placeholder="Article Title"
                        value={article.title}
                        onChange={handleTitleChange}
                        className="w-full text-3xl font-serif text-charcoal placeholder-stone-400 focus:outline-none"
                    />
                    <textarea
                        name="subtitle"
                        placeholder="A captivating subtitle..."
                        value={article.subtitle}
                        onChange={handleTitleChange}
                        className="w-full mt-2 text-lg text-stone-500 placeholder-stone-400 focus:outline-none resize-none"
                        rows={1}
                    />
                    <div className="mt-6 grid gap-4 md:grid-cols-2">
                        <div>
                            <label htmlFor="article-author" className="block text-sm font-medium text-stone-700 mb-1">
                                Published By
                            </label>
                            <input
                                id="article-author"
                name="author"
                                type="text"
                                value={article.author}
                                onChange={handleTitleChange}
                                placeholder="e.g., Ada Lovelace"
                                className="w-full border border-stone-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gold"
                            />
                        </div>
                        <div>
                            <label htmlFor="article-date" className="block text-sm font-medium text-stone-700 mb-1">
                                Publish Date
                            </label>
                            <input
                                id="article-date"
                                name="publishDate"
                                type="text"
                                value={article.publishDate}
                                onChange={handleTitleChange}
                                placeholder="e.g., October 20, 2025"
                                className="w-full border border-stone-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gold"
                            />
                        </div>
                    </div>
                     <div className="mt-4">
                        <label className="block text-sm font-medium text-stone-700 mb-1">Hero Image</label>
                        <input type="file" accept="image/*" onChange={handleHeroImageUpload} className="text-sm" />
                        {article.heroImage && <img src={article.heroImage} alt="Hero" className="mt-2 rounded-md h-32 object-cover"/>}
                    </div>
                </div>

                <div className="p-6 space-y-4">
                    {contentBlocks.map((block) => (
                        <div
                            key={block.id}
                            draggable
                            onDragStart={(e) => handleDragStart(e, block.id)}
                            onDragOver={handleDragOver}
                            onDrop={(e) => handleDrop(e, block.id)}
                            onDragEnd={handleDragEnd}
                            className={`group relative border border-stone-200 rounded-lg p-4 bg-white transition-shadow hover:shadow-md ${dragging === block.id ? 'ring-1 ring-gold/80' : ''}`}
                        >
                            <button
                                onClick={() => removeBlock(block.id)}
                                className="absolute -top-3 -right-3 bg-red-500 text-white rounded-full p-1.5 z-10 shadow focus:outline-none focus:ring-2 focus:ring-red-200 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity"
                                title="Remove block"
                            >
                                <TrashIcon className="w-3 h-3"/>
                            </button>

                            {block.type === BlockType.TEXT && (
                                <div className="relative group">
                                    <TextEditorToolbar blockId={block.id} />
                                    <div
                                        contentEditable
                                        suppressContentEditableWarning
                                        onBlur={(e) => handleContentChange(block.id, { content: e.currentTarget.innerHTML })}
                                        dangerouslySetInnerHTML={{ __html: block.content }}
                                        className="prose max-w-none focus:outline-none focus:ring-1 focus:ring-gold rounded-md p-2"
                                    />
                                </div>
                            )}
                            {block.type === BlockType.IMAGE && (
                                <div>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        className="mb-2 text-sm"
                                        onChange={async e => {
                                            if (e.target.files?.[0]) handleContentChange(block.id, { src: await fileToBase64(e.target.files[0])});
                                        }}
                                    />
                                    {block.src && <img src={block.src} alt={block.caption} className="rounded-md"/>}
                                    <input
                                        type="text"
                                        placeholder="Image caption"
                                        value={block.caption}
                                        onChange={e => handleContentChange(block.id, { caption: e.target.value })}
                                        className="w-full mt-2 text-sm text-center italic text-stone-500 focus:outline-none"
                                    />
                                </div>
                            )}
                            {block.type === BlockType.AUDIO && (
                                <div className="space-y-2">
                                    <input
                                        type="text"
                                        placeholder="Audio Title"
                                        value={block.title}
                                        onChange={e => handleContentChange(block.id, { title: e.target.value })}
                                        className="w-full font-semibold text-charcoal focus:outline-none"
                                    />
                                    <AudioRecorder onRecordingComplete={(audioUrl) => handleContentChange(block.id, { src: audioUrl })} />
                                    {block.src && <audio src={block.src} controls className="w-full" />}
                                </div>
                            )}
                             {block.type === BlockType.SPONSORSHIP && (
                                <div className="p-4 bg-stone-50 border border-stone-200 rounded-md space-y-3">
                                    <h4 className="text-sm font-semibold text-stone-500 uppercase tracking-wider">Sponsorship Block</h4>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        className="text-sm"
                                        onChange={async e => {
                                            if (e.target.files?.[0]) handleContentChange(block.id, { logoSrc: await fileToBase64(e.target.files[0])});
                                        }}
                                    />
                                    {block.logoSrc && <img src={block.logoSrc} alt="Sponsor Logo" className="h-16 mb-2 object-contain"/>}
                                    <input
                                        type="text"
                                        placeholder="Company Name"
                                        value={block.company}
                                        onChange={e => handleContentChange(block.id, { company: e.target.value })}
                                        className="w-full p-1 border-b focus:outline-none"
                                    />
                                    <input
                                        type="text"
                                        placeholder="https://sponsor.link"
                                        value={block.link}
                                        onChange={e => handleContentChange(block.id, { link: e.target.value })}
                                        className="w-full p-1 border-b focus:outline-none"
                                    />
                                </div>
                            )}

                        </div>
                    ))}
                </div>
                
                 <div className="p-6 border-t border-stone-200 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                     <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-semibold text-stone-600 mr-2">Add Block:</span>
                        <button onClick={() => addBlock(BlockType.TEXT)} className="p-2 bg-stone-100 hover:bg-stone-200 rounded-md" title="Add Text"><TextIcon className="w-5 h-5"/></button>
                        <button onClick={() => addBlock(BlockType.IMAGE)} className="p-2 bg-stone-100 hover:bg-stone-200 rounded-md" title="Add Image"><ImageIcon className="w-5 h-5"/></button>
                        <button onClick={() => addBlock(BlockType.AUDIO)} className="p-2 bg-stone-100 hover:bg-stone-200 rounded-md" title="Add Audio"><MicIcon className="w-5 h-5"/></button>
                        <button onClick={() => addBlock(BlockType.SPONSORSHIP)} className="p-2 bg-stone-100 hover:bg-stone-200 rounded-md" title="Add Sponsorship"><DollarSignIcon className="w-5 h-5"/></button>
                    </div>
                    <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:space-x-2">
                         <button onClick={onClose} className="px-4 py-2 text-sm font-semibold text-stone-600 bg-stone-100 rounded-md hover:bg-stone-200">Close</button>
                         <button
                            onClick={handleSaveClick}
                            disabled={isSaving}
                            aria-busy={isSaving}
                            className="px-6 py-2 text-sm font-semibold text-white bg-charcoal rounded-md hover:bg-stone-700 disabled:opacity-70 disabled:cursor-not-allowed"
                         >
                            {isSaving ? 'Saving...' : 'Save & Publish'}
                         </button>
                    </div>
                </div>

            </div>
            <div className="h-16"></div>
        </div>
    );
};
