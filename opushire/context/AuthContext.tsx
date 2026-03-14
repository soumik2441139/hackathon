'use client';
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { auth, VerificationChallenge } from '@/lib/api';
import { User } from '@/lib/types';

const PENDING_VERIFICATION_EMAIL_KEY = 'opushire_pending_verification_email';

interface RegistrationData {
    name: string;
    email: string;
    password: string;
    role?: 'student' | 'admin';
    college?: string;
    degree?: string;
    year?: string;
}

interface AuthContextValue {
    user: User | null;
    token: string | null;
    loading: boolean;
    login: (email: string, password: string) => Promise<void>;
    register: (data: RegistrationData) => Promise<VerificationChallenge>;
    verifyEmail: (email: string, code: string) => Promise<void>;
    resendVerificationCode: (email: string) => Promise<VerificationChallenge>;
    refreshUser: () => Promise<void>;
    logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    const clearRoleThemes = useCallback(() => {
        const root = document.documentElement;
        Array.from(root.classList)
            .filter((className) => className.startsWith('theme-'))
            .forEach((className) => root.classList.remove(className));
    }, []);

    const setPendingVerificationEmail = useCallback((email: string) => {
        if (typeof window !== 'undefined') {
            sessionStorage.setItem(PENDING_VERIFICATION_EMAIL_KEY, email);
        }
    }, []);

    const clearPendingVerificationEmail = useCallback(() => {
        if (typeof window !== 'undefined') {
            sessionStorage.removeItem(PENDING_VERIFICATION_EMAIL_KEY);
        }
    }, []);

    const routeByRole = useCallback((nextUser: User) => {
        if (nextUser.role === 'admin') router.push('/dashboard/admin');
        else router.push('/dashboard/student');
    }, [router]);

    // Restore session from localStorage on mount & verify with server
    useEffect(() => {
        const initAuth = async () => {
            const storedToken = localStorage.getItem('opushire_token');
            const storedUser = localStorage.getItem('opushire_user');

            if (storedToken && storedUser) {
                try {
                    // Verify session with server to ensure role integrity
                    const res = await auth.getMe();
                    if (res.success && res.data) {
                        // Refresh state with latest data from DB
                        setToken(storedToken);
                        setUser(res.data);
                        localStorage.setItem('opushire_user', JSON.stringify(res.data));
                    } else {
                        throw new Error('Invalid session');
                    }
                } catch (err) {
                    console.error('Session verification failed:', err);
                    localStorage.removeItem('opushire_token');
                    localStorage.removeItem('opushire_user');
                    setToken(null);
                    setUser(null);
                }
            }
            setLoading(false);
        };

        initAuth();
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
        routeByRole(res.data.user);
    }, [routeByRole]);

    const register = useCallback(async (data: RegistrationData) => {
        const res = await auth.register({ ...data });
        setPendingVerificationEmail(res.data.email);
        router.push(`/verify-email?email=${encodeURIComponent(res.data.email)}`);
        return res.data;
    }, [router, setPendingVerificationEmail]);

    const verifyEmail = useCallback(async (email: string, code: string) => {
        const res = await auth.verifyEmail({ email, code });
        persist(res.data.user, res.data.token);
        clearPendingVerificationEmail();
        routeByRole(res.data.user);
    }, [clearPendingVerificationEmail, routeByRole]);

    const resendVerificationCode = useCallback(async (email: string) => {
        const res = await auth.resendVerificationCode({ email });
        setPendingVerificationEmail(res.data.email);
        return res.data;
    }, [setPendingVerificationEmail]);

    // Apply theme based on role
    useEffect(() => {
        const root = document.documentElement;
        clearRoleThemes();
        if (user?.role === 'student') root.classList.add('theme-student');
        else if (user?.role === 'admin') root.classList.add('theme-admin');
    }, [clearRoleThemes, user?.role]);

    const logout = useCallback(() => {
        localStorage.removeItem('opushire_token');
        localStorage.removeItem('opushire_user');
        clearRoleThemes();
        setToken(null);
        setUser(null);
        clearPendingVerificationEmail();
        router.push('/');
    }, [clearPendingVerificationEmail, clearRoleThemes, router]);

    const refreshUser = useCallback(async () => {
        try {
            const res = await auth.getMe();
            if (res.success && res.data) {
                const currentToken = localStorage.getItem('opushire_token') || token;
                if (currentToken) {
                    persist(res.data, currentToken);
                }
            }
        } catch (err) {
            console.error('Failed to refresh user:', err);
        }
    }, [token]);

    return (
        <AuthContext.Provider
            value={{
                user,
                token,
                loading,
                login,
                register,
                verifyEmail,
                resendVerificationCode,
                refreshUser,
                logout,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth(): AuthContextValue {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
    return ctx;
}
