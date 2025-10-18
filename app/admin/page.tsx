'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../lib/auth-context';

export default function AdminLoginPage() {
    const { login } = useAuth();
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (email === 'admin@grindstories.com' && password === 'the beast, 123') {
            login();
            router.push('/dashboard');
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
}
