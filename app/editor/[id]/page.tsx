'use client';

import { useEffect } from 'react';
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

    if (!isAuthenticated || loading) {
        return <div className="min-h-screen flex items-center justify-center font-serif text-xl text-stone-500">Loading...</div>;
    }

    const article = id !== 'new' ? getArticle(id) : null;
    
    const newArticleTemplate: Article = {
        id: `grind-article-${Date.now()}`,
        title: '',
        subtitle: '',
        author: 'A. Vanderbilt',
        publishDate: new Date().toLocaleString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
        heroImage: '',
        content: [],
    };
    
    const articleToEdit = article || newArticleTemplate;

    const handleSave = async (updatedArticle: Article) => {
        if (id && id !== 'new') {
            await updateArticle(updatedArticle);
        } else {
            await addArticle({...updatedArticle, id: `grind-article-${Date.now()}`});
        }
        router.push('/dashboard');
    };

    return <ArticleEditor article={articleToEdit} onSave={handleSave} onClose={() => router.push('/dashboard')} />;
}
