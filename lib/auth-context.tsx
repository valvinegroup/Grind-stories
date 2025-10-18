'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

const AUTH_KEY = 'GRIND_ADMIN_AUTH';

interface AuthContextType {
    isAuthenticated: boolean;
    login: () => void;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        setIsAuthenticated(!!localStorage.getItem(AUTH_KEY));
        setIsLoaded(true);
    }, []);

    const login = () => {
        localStorage.setItem(AUTH_KEY, 'true');
        setIsAuthenticated(true);
    };

    const logout = () => {
        localStorage.removeItem(AUTH_KEY);
        setIsAuthenticated(false);
    };

    const value = { isAuthenticated, login, logout };

    if (!isLoaded) {
        return <div className="min-h-screen flex items-center justify-center font-serif text-xl text-stone-500">Loading...</div>;
    }

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === null) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
