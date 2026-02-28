'use client';
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/api';
import { User } from '@/lib/types';

interface AuthContextValue {
    user: User | null;
    token: string | null;
    loading: boolean;
    login: (email: string, password: string) => Promise<void>;
    register: (data: {
        name: string; email: string; password: string;
        college?: string; degree?: string; year?: string;
    }) => Promise<void>;
    logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    // Restore session from localStorage on mount
    useEffect(() => {
        const storedToken = localStorage.getItem('opushire_token');
        const storedUser = localStorage.getItem('opushire_user');
        if (storedToken && storedUser) {
            setToken(storedToken);
            setUser(JSON.parse(storedUser));
        }
        setLoading(false);
    }, []);

    const persist = (u: User, t: string) => {
        localStorage.setItem('opushire_token', t);
        localStorage.setItem('opushire_user', JSON.stringify(u));
        setToken(t);
        setUser(u);
    };

    const login = useCallback(async (email: string, password: string) => {
        const res = await auth.login({ email, password });
        persist(res.data.user, res.data.token);
        router.push(res.data.user.role === 'admin' ? '/dashboard/admin' : '/dashboard/student');
    }, [router]);

    const register = useCallback(async (data: {
        name: string; email: string; password: string;
        college?: string; degree?: string; year?: string;
    }) => {
        const res = await auth.register({ ...data, role: 'student' });
        persist(res.data.user, res.data.token);
        router.push('/dashboard/student');
    }, [router]);

    const logout = useCallback(() => {
        localStorage.removeItem('opushire_token');
        localStorage.removeItem('opushire_user');
        setToken(null);
        setUser(null);
        router.push('/');
    }, [router]);

    return (
        <AuthContext.Provider value={{ user, token, loading, login, register, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth(): AuthContextValue {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
    return ctx;
}
