'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useSupabaseData } from '../../../hooks/useSupabaseData';
import { BlockType, type ContentBlock } from '../../../lib/types';

const PublicHeader = () => (
    <header className="py-8 border-b border-stone-200">
        <div className="max-w-4xl mx-auto px-4 text-center">
            <Link href="/">
                <h1 className="text-4xl md:text-5xl font-serif font-bold text-charcoal">Grind Stories</h1>
                <p className="text-stone-500 mt-2">Stories of ambition and perseverance.</p>
            </Link>
        </div>
    </header>
);

const PublicFooter = () => (
    <footer className="py-8 mt-16 border-t border-stone-200 text-center text-sm text-stone-500">
        <p>&copy; {new Date().getFullYear()} Grind Stories. All Rights Reserved.</p>
        <p className="mt-1">Curated with care in the digital age.</p>
    </footer>
);

export default function ArticlePage() {
    const params = useParams();
    const id = params.id as string;
    const { getArticle, loading } = useSupabaseData();
    const article = getArticle(id);

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center font-serif text-xl text-stone-500">Loading...</div>;
    }

    if (!article) {
        return (
            <div className="text-center py-20">
                Article not found. <Link href="/" className="underline">Return home</Link>
            </div>
        );
    }

    const renderBlock = (block: ContentBlock) => {
        switch (block.type) {
            case BlockType.TEXT:
                return <div className="prose max-w-none text-lg text-charcoal" dangerouslySetInnerHTML={{ __html: block.content }} />;
            case BlockType.IMAGE:
                return (
                    <figure>
                        {block.src ? (
                            <img src={block.src} alt={block.caption || 'Article image'} className="rounded-lg shadow-md" />
                        ) : (
                            <div className="h-48 bg-stone-100 rounded-lg shadow-inner flex items-center justify-center text-stone-400 uppercase tracking-widest text-xs">
                                Image coming soon
                            </div>
                        )}
                        {block.caption && (
                            <figcaption className="text-center text-sm text-stone-500 italic mt-2">{block.caption}</figcaption>
                        )}
                    </figure>
                );
            case BlockType.AUDIO:
                return (
                    <div className="p-4 bg-stone-100 border border-stone-200 rounded-lg">
                        {block.title && <h4 className="font-semibold mb-2">{block.title}</h4>}
                        {block.src ? (
                            <audio controls src={block.src} className="w-full"></audio>
                        ) : (
                            <p className="text-sm text-stone-500">Audio clip coming soon.</p>
                        )}
                    </div>
                );
            case BlockType.SPONSORSHIP:
                return (
                    <a href={block.link || '#'} target="_blank" rel="noopener noreferrer" className="block p-4 bg-stone-50 border border-stone-200 rounded-lg no-underline hover:bg-stone-100 transition-colors">
                        <div className="flex items-center space-x-4">
                            {block.logoSrc ? (
                                <img src={block.logoSrc} alt={block.company || 'Sponsor'} className="h-16 w-16 object-contain"/>
                            ) : (
                                <div className="h-16 w-16 bg-stone-100 rounded flex items-center justify-center text-xs text-stone-400 uppercase tracking-widest">
                                    Logo
                                </div>
                            )}
                            <div>
                                <p className="text-xs text-stone-400 uppercase tracking-wider">Sponsored by</p>
                                <p className="font-semibold text-charcoal">{block.company}</p>
                            </div>
                        </div>
                    </a>
                );
            default:
                return null;
        }
    };

    return (
        <>
            <PublicHeader />
            <main className="max-w-2xl mx-auto px-4 mt-12">
                <article>
                    <header className="text-center mb-12">
                        <h1 className="text-4xl md:text-5xl font-serif font-bold text-charcoal leading-tight">{article.title}</h1>
                        <p className="text-xl text-stone-600 mt-4">{article.subtitle}</p>
                        <p className="text-sm text-stone-400 mt-6">{article.publishDate} &middot; {article.author}</p>
                    </header>
                    {article.heroImage ? (
                        <img src={article.heroImage} alt={article.title || 'Article hero image'} className="w-full h-auto object-cover rounded-lg shadow-xl mb-12" />
                    ) : (
                        <div className="w-full h-64 bg-stone-100 rounded-lg shadow-inner mb-12 flex items-center justify-center text-stone-400 uppercase tracking-widest text-sm">
                            Image coming soon
                        </div>
                    )}
                    <div className="space-y-8">
                        {article.content.map(block => <div key={block.id}>{renderBlock(block)}</div>)}
                    </div>
                </article>
            </main>
            <PublicFooter />
        </>
    );
}
