'use client';

import { useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '../../../lib/auth-context';
import { useSupabaseData } from '../../../hooks/useSupabaseData';
import { ArticleEditor } from '../../../components/ArticleEditor';
import type { Article } from '../../../lib/types';

export default function EditorPage() {
    const { isAuthenticated } = useAuth();
    const router = useRouter();
    const params = useParams();
    const id = params.id as string;
    const { getArticle, updateArticle, addArticle, loading } = useSupabaseData();

    useEffect(() => {
        if (!isAuthenticated) {
            router.push('/admin');
        }
    }, [isAuthenticated, router]);

    const isNewArticle = id === 'new';

    const createBlankArticle = () => ({
        id: `grind-article-${Date.now()}`,
        title: '',
        subtitle: '',
        author: '',
        publishDate: new Date().toLocaleString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
        heroImage: '',
        content: [],
    } as Article);

    const newArticleRef = useRef<Article | null>(null);
    if (isNewArticle) {
        if (!newArticleRef.current) {
            newArticleRef.current = createBlankArticle();
        }
    } else {
        newArticleRef.current = null;
    }

    if (!isAuthenticated || (loading && !isNewArticle)) {
        return <div className="min-h-screen flex items-center justify-center font-serif text-xl text-stone-500">Loading...</div>;
    }

    const article = !isNewArticle ? getArticle(id) : null;
    
    const articleToEdit = article || newArticleRef.current || createBlankArticle();

    const handleSave = async (updatedArticle: Article) => {
        if (!isNewArticle) {
            await updateArticle(updatedArticle);
        } else {
            await addArticle({
                ...updatedArticle,
                id: updatedArticle.id || `grind-article-${Date.now()}`,
            });
        }
        router.push('/dashboard');
    };

    return <ArticleEditor article={articleToEdit} onSave={handleSave} onClose={() => router.push('/dashboard')} />;
}
