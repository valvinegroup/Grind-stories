'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../../lib/auth-context';
import { useSupabaseData } from '../../hooks/useSupabaseData';

export default function AdminDashboard() {
    const { isAuthenticated, logout } = useAuth();
    const router = useRouter();
    const { articles, deleteArticle, subscribers, loading } = useSupabaseData();

    useEffect(() => {
        if (!isAuthenticated) {
            router.push('/admin');
        }
    }, [isAuthenticated, router]);

    const handleLogoutClick = () => {
        logout();
        router.push('/admin');
    };
    
    const handleDeleteClick = (articleId: string, articleTitle: string) => {
        if (window.confirm(`Are you sure you want to delete "${articleTitle}"? This action cannot be undone.`)) {
            deleteArticle(articleId);
        }
    };

    const handleDownloadCsv = () => {
        if (subscribers.length === 0) {
            alert('No subscribers to download.');
            return;
        }
        const csvHeader = 'name,email,subscribedAt\n';
        const csvRows = subscribers.map(s => `"${s.name.replace(/"/g, '""')}","${s.email}","${s.subscribedAt}"`).join('\n');
        const csvContent = csvHeader + csvRows;
        
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', 'grind-stories-subscribers.csv');
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    if (!isAuthenticated || loading) {
        return <div className="min-h-screen flex items-center justify-center font-serif text-xl text-stone-500">Loading...</div>;
    }

    return (
        <div className="p-8">
            <div className="max-w-5xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-serif">Admin Dashboard</h1>
                    <div>
                        <Link href="/editor/new" className="bg-charcoal text-white font-semibold py-2 px-4 rounded-md hover:bg-stone-700 transition-colors mr-4">New Article</Link>
                        <button onClick={handleLogoutClick} className="text-sm text-stone-600 hover:underline">Logout</button>
                    </div>
                </div>
                <div className="bg-white border border-stone-200 rounded-lg shadow-sm">
                    <ul>
                        {articles.map((article, index) => (
                            <li key={article.id} className={`flex justify-between items-center p-4 ${index < articles.length - 1 ? 'border-b border-stone-200' : ''}`}>
                                <div>
                                    <h3 className="font-semibold text-charcoal">{article.title}</h3>
                                    <p className="text-sm text-stone-500">{article.publishDate}</p>
                                </div>
                                <div className="flex items-center space-x-4">
                                    <Link href={`/editor/${article.id}`} className="text-sm font-semibold text-gold hover:underline">Edit</Link>
                                    <button onClick={() => handleDeleteClick(article.id, article.title)} className="text-sm font-semibold text-red-600 hover:underline">Delete</button>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>

                <div className="mt-12">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-2xl font-serif">Subscribers ({subscribers.length})</h2>
                        <button onClick={handleDownloadCsv} className="bg-stone-600 text-white font-semibold py-2 px-4 rounded-md hover:bg-stone-700 transition-colors text-sm">Download CSV</button>
                    </div>
                    <div className="bg-white border border-stone-200 rounded-lg shadow-sm">
                        {subscribers.length > 0 ? (
                            <ul>
                                {subscribers.map((subscriber, index) => (
                                    <li key={index} className={`flex justify-between items-center p-4 ${index < subscribers.length - 1 ? 'border-b border-stone-200' : ''}`}>
                                        <div>
                                            <p className="font-semibold text-charcoal">{subscriber.name || 'Unnamed subscriber'}</p>
                                            <p className="text-sm text-stone-500">{subscriber.email}</p>
                                        </div>
                                        <span className="text-sm text-stone-500">Subscribed on: {subscriber.subscribedAt}</span>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="p-4 text-stone-500">No subscribers yet.</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
