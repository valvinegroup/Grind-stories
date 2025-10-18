import React, { useState, useEffect, useContext, createContext } from 'react';
import { HashRouter, Routes, Route, Link, useParams, useNavigate } from 'react-router-dom';
import { useMockData } from './hooks/useMockData';
import type { Article, ContentBlock, Subscriber } from './types';
import { BlockType } from './types';
import { EmailCapture } from './components/EmailCapture';
import { ArticleEditor } from './components/ArticleEditor';

const AUTH_KEY = 'GRIND_ADMIN_AUTH';

// --- Authentication Context ---
interface AuthContextType {
    isAuthenticated: boolean;
    login: () => void;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem(AUTH_KEY));

    const login = () => {
        localStorage.setItem(AUTH_KEY, 'true');
        setIsAuthenticated(true);
    };

    const logout = () => {
        localStorage.removeItem(AUTH_KEY);
        setIsAuthenticated(false);
    };

    const value = { isAuthenticated, login, logout };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === null) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};


const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { isAuthenticated } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (!isAuthenticated) {
            navigate('/admin');
        }
    }, [isAuthenticated, navigate]);

    return isAuthenticated ? <>{children}</> : null;
};

// --- Components ---

const PublicHeader = () => (
    <header className="py-8 border-b border-stone-200">
        <div className="max-w-4xl mx-auto px-4 text-center">
            <Link to="/">
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

const ArticleCard: React.FC<{ article: Article }> = ({ article }) => (
    <Link to={`/article/${article.id}`} className="block group">
        <div className="overflow-hidden rounded-lg">
            <img src={article.heroImage} alt={article.title} className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-500 ease-in-out" />
        </div>
        <div className="mt-4">
            <h2 className="text-2xl font-serif text-charcoal group-hover:text-gold transition-colors">{article.title}</h2>
            <p className="text-stone-600 mt-1">{article.subtitle}</p>
            <p className="text-sm text-stone-400 mt-2">{article.publishDate} &middot; {article.author}</p>
        </div>
    </Link>
);


// --- Pages ---

const HomePage: React.FC<{ articles: Article[], onSubscribe: (email: string) => void }> = ({ articles, onSubscribe }) => (
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
        <EmailCapture onSubscribe={onSubscribe} />
    </>
);

const ArticlePage: React.FC<{ getArticle: (id: string) => Article | undefined }> = ({ getArticle }) => {
    const { id } = useParams<{ id: string }>();
    const article = id ? getArticle(id) : undefined;

    if (!article) {
        return <div className="text-center py-20">Article not found. <Link to="/" className="underline">Return home</Link></div>;
    }

    const renderBlock = (block: ContentBlock) => {
        switch (block.type) {
            case BlockType.TEXT:
                return <div className="prose max-w-none text-lg text-charcoal" dangerouslySetInnerHTML={{ __html: block.content }} />;
            case BlockType.IMAGE:
                return <figure><img src={block.src} alt={block.caption} className="rounded-lg shadow-md" /><figcaption className="text-center text-sm text-stone-500 italic mt-2">{block.caption}</figcaption></figure>;
            case BlockType.AUDIO:
                return <div className="p-4 bg-stone-100 border border-stone-200 rounded-lg"><h4 className="font-semibold mb-2">{block.title}</h4><audio controls src={block.src} className="w-full"></audio></div>;
            case BlockType.SPONSORSHIP:
                return (
                    <a href={block.link} target="_blank" rel="noopener noreferrer" className="block p-4 bg-stone-50 border border-stone-200 rounded-lg no-underline hover:bg-stone-100 transition-colors">
                        <div className="flex items-center space-x-4">
                            <img src={block.logoSrc} alt={block.company} className="h-16 w-16 object-contain"/>
                            <div>
                                <p className="text-xs text-stone-400 uppercase tracking-wider">Sponsored by</p>
                                <p className="font-semibold text-charcoal">{block.company}</p>
                            </div>
                        </div>
                    </a>
                )
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
                    <img src={article.heroImage} alt={article.title} className="w-full h-auto object-cover rounded-lg shadow-xl mb-12" />
                    <div className="space-y-8">
                        {article.content.map(block => <div key={block.id}>{renderBlock(block)}</div>)}
                    </div>
                </article>
            </main>
            <PublicFooter />
        </>
    );
};

const AdminLoginPage: React.FC = () => {
    const { login } = useAuth();
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Hardcoded credentials for this example
        if (email === 'admin@grindstories.com' && password === 'the beast, 123') {
            login();
            navigate('/dashboard');
        } else {
            setError('Invalid credentials. Please try again.');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-stone-100">
            <div className="w-full max-w-md bg-white p-8 rounded-lg shadow-lg border border-stone-200">
                <h1 className="text-3xl font-serif text-charcoal text-center mb-2">Grind Stories</h1>
                <p className="text-center text-stone-500 mb-6">Administrator Login</p>
                {error && <p className="bg-red-100 text-red-700 p-3 rounded-md text-sm mb-4">{error}</p>}
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-stone-700">Email</label>
                        <input type="email" value={email} onChange={e => setEmail(e.target.value)} required className="mt-1 w-full px-3 py-2 border border-stone-300 rounded-md focus:outline-none focus:ring-1 focus:ring-gold" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-stone-700">Password</label>
                        <input type="password" value={password} onChange={e => setPassword(e.target.value)} required className="mt-1 w-full px-3 py-2 border border-stone-300 rounded-md focus:outline-none focus:ring-1 focus:ring-gold" />
                    </div>
                    <button type="submit" className="w-full bg-charcoal text-white font-semibold py-2 rounded-md hover:bg-stone-700 transition-colors">
                        Sign In
                    </button>
                </form>
            </div>
        </div>
    );
};

const AdminDashboard: React.FC<{ articles: Article[], deleteArticle: (id: string) => void, subscribers: Subscriber[] }> = ({ articles, deleteArticle, subscribers }) => {
    const { logout } = useAuth();
    const navigate = useNavigate();

    const handleLogoutClick = () => {
        logout();
        navigate('/admin');
    }
    
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
        const csvHeader = 'email,subscribedAt\n';
        const csvRows = subscribers.map(s => `"${s.email}","${s.subscribedAt}"`).join('\n');
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

    return (
        <div className="p-8">
            <div className="max-w-5xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-serif">Admin Dashboard</h1>
                    <div>
                        <Link to="/editor/new" className="bg-charcoal text-white font-semibold py-2 px-4 rounded-md hover:bg-stone-700 transition-colors mr-4">New Article</Link>
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
                                  <Link to={`/editor/${article.id}`} className="text-sm font-semibold text-gold hover:underline">Edit</Link>
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
                                        <span className="text-charcoal">{subscriber.email}</span>
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
};

const EditorPage: React.FC<{ getArticle: (id: string) => Article | undefined; onSave: (article: Article) => void; onAdd: (article: Article) => void; }> = ({ getArticle, onSave, onAdd }) => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const article = id ? getArticle(id) : null;
    
    const newArticleTemplate: Article = {
        id: `new-article-${Date.now()}`,
        title: '',
        subtitle: '',
        author: 'A. Vanderbilt',
        publishDate: new Date().toLocaleString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
        heroImage: '',
        content: [],
    };
    
    const articleToEdit = article || newArticleTemplate;

    const handleSave = (updatedArticle: Article) => {
        if(id && id !== 'new') {
            onSave(updatedArticle);
        } else {
            onAdd({...updatedArticle, id: `article-${Date.now()}`});
        }
        navigate('/dashboard');
    };

    return <ArticleEditor article={articleToEdit} onSave={handleSave} onClose={() => navigate('/dashboard')} />;
};


// --- Main App Structure ---

function AppContent() {
    const { articles, getArticle, updateArticle, addArticle, deleteArticle, subscribers, addSubscriber } = useMockData();
    
    return (
        <Routes>
            <Route path="/" element={<HomePage articles={articles} onSubscribe={addSubscriber} />} />
            <Route path="/article/:id" element={<ArticlePage getArticle={getArticle} />} />
            <Route path="/admin" element={<AdminLoginPage />} />
            <Route path="/dashboard" element={<ProtectedRoute><AdminDashboard articles={articles} deleteArticle={deleteArticle} subscribers={subscribers} /></ProtectedRoute>} />
            <Route path="/editor/new" element={<ProtectedRoute><EditorPage getArticle={getArticle} onSave={updateArticle} onAdd={addArticle}/></ProtectedRoute>} />
            <Route path="/editor/:id" element={<ProtectedRoute><EditorPage getArticle={getArticle} onSave={updateArticle} onAdd={addArticle}/></ProtectedRoute>} />
        </Routes>
    );
}

export default function App() {
    return (
        <HashRouter>
            <AuthProvider>
                <AppContent />
            </AuthProvider>
        </HashRouter>
    );
}
