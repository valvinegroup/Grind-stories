import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { Article, ContentBlock } from '../types';
import { BlockType } from '../types';
import { AudioRecorder } from './AudioRecorder';
import { BoldIcon, ItalicIcon, H2Icon, ImageIcon, MicIcon, DollarSignIcon, TextIcon, TrashIcon, SparklesIcon } from './icons';
import { generateText } from '../services/geminiService';

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

export const ArticleEditor: React.FC<ArticleEditorProps> = ({ article: initialArticle, onSave, onClose }) => {
    const [article, setArticle] = useState<Article>(initialArticle);
    const [dragging, setDragging] = useState<string | null>(null);

    const [isAiModalOpen, setIsAiModalOpen] = useState(false);
    const [aiPrompt, setAiPrompt] = useState('');
    const [aiLoading, setAiLoading] = useState(false);
    const [activeTextBlockId, setActiveTextBlockId] = useState<string | null>(null);

    const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setArticle(prev => ({ ...prev, [name]: value }));
    };

    // FIX: Added type assertion to fix type inference issue with spread operator on a discriminated union.
    const handleContentChange = (id: string, newContent: Partial<ContentBlock>) => {
        setArticle(prev => ({
            ...prev,
            content: prev.content.map(block =>
                block.id === id ? ({ ...block, ...newContent } as ContentBlock) : block
            ),
        }));
    };

    // FIX: Replaced conditional spreading with a switch statement to ensure type safety for new blocks.
    const addBlock = (type: BlockType) => {
        let newBlock: ContentBlock;
        const id = Date.now().toString();

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
                // This should not be reached if all block types are handled
                return;
        }

        setArticle(prev => ({ ...prev, content: [...prev.content, newBlock] }));
    };

    const removeBlock = (id: string) => {
        setArticle(prev => ({
            ...prev,
            content: prev.content.filter(block => block.id !== id),
        }));
    };
    
    // Drag and Drop handlers
    const handleDragStart = (e: React.DragEvent<HTMLDivElement>, id: string) => {
        setDragging(id);
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>, dropId: string) => {
        e.preventDefault();
        if (!dragging) return;

        const originalIndex = article.content.findIndex(b => b.id === dragging);
        const newIndex = article.content.findIndex(b => b.id === dropId);
        
        if (originalIndex === -1 || newIndex === -1) return;

        const newContent = [...article.content];
        const [removed] = newContent.splice(originalIndex, 1);
        newContent.splice(newIndex, 0, removed);

        setArticle(prev => ({ ...prev, content: newContent }));
        setDragging(null);
    };

    // Text Editor Toolbar
    const TextEditorToolbar: React.FC<{ blockId: string }> = ({ blockId }) => {
        // FIX: Updated execCmd to accept an optional value argument for commands that require it.
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
                     <div className="mt-4">
                        <label className="block text-sm font-medium text-stone-700 mb-1">Hero Image</label>
                        <input type="file" accept="image/*" onChange={handleHeroImageUpload} className="text-sm" />
                        {article.heroImage && <img src={article.heroImage} alt="Hero" className="mt-2 rounded-md h-32 object-cover"/>}
                    </div>
                </div>

                <div className="p-6 space-y-4">
                    {article.content.map((block) => (
                         <div 
                            key={block.id} 
                            draggable 
                            onDragStart={(e) => handleDragStart(e, block.id)} 
                            onDragOver={handleDragOver}
                            onDrop={(e) => handleDrop(e, block.id)}
                            className={`relative p-2 border-2 border-transparent hover:border-gold/50 rounded-md transition-colors ${dragging === block.id ? 'opacity-50' : ''}`}
                        >
                            <button onClick={() => removeBlock(block.id)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 z-10 opacity-0 hover:opacity-100 transition-opacity">
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
                                    <input type="file" accept="image/*" className="mb-2 text-sm" onChange={async e => {
                                        if (e.target.files?.[0]) handleContentChange(block.id, { src: await fileToBase64(e.target.files[0])})
                                    }}/>
                                    {block.src && <img src={block.src} alt={block.caption} className="rounded-md"/>}
                                    <input type="text" placeholder="Image caption" value={block.caption} onChange={e => handleContentChange(block.id, { caption: e.target.value })}
                                    className="w-full mt-2 text-sm text-center italic text-stone-500 focus:outline-none" />
                                </div>
                            )}
                            {block.type === BlockType.AUDIO && (
                                <div>
                                    <input type="text" placeholder="Audio Title" value={block.title} onChange={e => handleContentChange(block.id, { title: e.target.value })}
                                        className="w-full mb-2 font-semibold text-charcoal focus:outline-none" />
                                    <AudioRecorder onRecordingComplete={(audioUrl) => handleContentChange(block.id, { src: audioUrl })} />
                                    {block.src && <audio src={block.src} controls className="w-full mt-2" />}
                                </div>
                            )}
                             {block.type === BlockType.SPONSORSHIP && (
                                <div className="p-4 bg-stone-50 border border-stone-200 rounded-md">
                                    <h4 className="text-sm font-semibold text-stone-500 uppercase tracking-wider mb-3">Sponsorship Block</h4>
                                    <input type="file" accept="image/*" className="mb-2 text-sm" onChange={async e => {
                                        if (e.target.files?.[0]) handleContentChange(block.id, { logoSrc: await fileToBase64(e.target.files[0])})
                                    }}/>
                                    {block.logoSrc && <img src={block.logoSrc} alt="Sponsor Logo" className="h-16 mb-2"/>}
                                    <input type="text" placeholder="Company Name" value={block.company} onChange={e => handleContentChange(block.id, { company: e.target.value })}
                                        className="w-full p-1 border-b mb-2 focus:outline-none" />
                                    <input type="text" placeholder="https://sponsor.link" value={block.link} onChange={e => handleContentChange(block.id, { link: e.target.value })}
                                        className="w-full p-1 border-b focus:outline-none" />
                                </div>
                            )}

                        </div>
                    ))}
                </div>
                
                 <div className="p-6 border-t border-stone-200 flex items-center justify-between">
                     <div className="flex items-center space-x-2">
                        <span className="text-sm font-semibold text-stone-600 mr-2">Add Block:</span>
                        <button onClick={() => addBlock(BlockType.TEXT)} className="p-2 bg-stone-100 hover:bg-stone-200 rounded-md" title="Add Text"><TextIcon className="w-5 h-5"/></button>
                        <button onClick={() => addBlock(BlockType.IMAGE)} className="p-2 bg-stone-100 hover:bg-stone-200 rounded-md" title="Add Image"><ImageIcon className="w-5 h-5"/></button>
                        <button onClick={() => addBlock(BlockType.AUDIO)} className="p-2 bg-stone-100 hover:bg-stone-200 rounded-md" title="Add Audio"><MicIcon className="w-5 h-5"/></button>
                        <button onClick={() => addBlock(BlockType.SPONSORSHIP)} className="p-2 bg-stone-100 hover:bg-stone-200 rounded-md" title="Add Sponsorship"><DollarSignIcon className="w-5 h-5"/></button>
                    </div>
                    <div className="flex items-center space-x-2">
                         <button onClick={onClose} className="px-4 py-2 text-sm font-semibold text-stone-600 bg-stone-100 rounded-md hover:bg-stone-200">Close</button>
                         <button onClick={() => onSave(article)} className="px-6 py-2 text-sm font-semibold text-white bg-charcoal rounded-md hover:bg-stone-700">Save & Publish</button>
                    </div>
                </div>

            </div>
            <div className="h-16"></div> {/* Spacer for bottom */}
        </div>
    );
};