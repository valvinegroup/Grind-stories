'use client';

import Link from 'next/link';
import { useSupabaseData } from '../hooks/useSupabaseData';
import { EmailCapture } from '../components/EmailCapture';
import type { Article } from '../lib/types';

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

const ArticleCard: React.FC<{ article: Article }> = ({ article }) => {
  const metaPieces = [article.publishDate, article.author].filter(
    (piece): piece is string => typeof piece === 'string' && piece.trim().length > 0
  );

  return (
    <Link href={`/article/${article.id}`} className="block group">
        <div className="overflow-hidden rounded-lg bg-stone-100 flex items-center justify-center">
            {article.heroImage ? (
                <img
                    src={article.heroImage}
                    alt={article.title || 'Article hero image'}
                    className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-500 ease-in-out"
                />
            ) : (
                <div className="w-full h-64 flex items-center justify-center text-stone-400 text-sm tracking-wide uppercase">
                    Image coming soon
                </div>
            )}
        </div>
        <div className="mt-4">
            <h2 className="text-2xl font-serif text-charcoal group-hover:text-gold transition-colors">{article.title}</h2>
            <p className="text-stone-600 mt-1">{article.subtitle}</p>
            {metaPieces.length > 0 && (
              <p className="text-sm text-stone-400 mt-2">{metaPieces.join(' \u00b7 ')}</p>
            )}
        </div>
    </Link>
  );
};

export default function Home() {
  const { articles, addSubscriber, loading } = useSupabaseData();

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center font-serif text-xl text-stone-500">Loading Stories...</div>;
  }

  return (
    <>
      <PublicHeader />
      <main className="max-w-4xl mx-auto px-4 mt-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          {articles.map((article) => (
            <ArticleCard key={article.id} article={article} />
          ))}
        </div>
      </main>
      <PublicFooter />
      <EmailCapture onSubscribe={addSubscriber} />
    </>
  );
}
