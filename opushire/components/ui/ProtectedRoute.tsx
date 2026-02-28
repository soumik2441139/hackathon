"use client";
import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

interface ProtectedRouteProps {
    children: React.ReactNode;
    requiredRole?: 'student' | 'admin';
}

export const ProtectedRoute = ({ children, requiredRole }: ProtectedRouteProps) => {
    const { user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (loading) return;
        if (!user) { router.replace('/login'); return; }
        if (requiredRole && user.role !== requiredRole) {
            router.replace(user.role === 'admin' ? '/dashboard/admin' : '/dashboard/student');
        }
    }, [user, loading, requiredRole, router]);

    if (loading || !user) return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="w-10 h-10 rounded-full border-2 border-brand-violet border-t-transparent animate-spin" />
        </div>
    );

    if (requiredRole && user.role !== requiredRole) return null;

    return <>{children}</>;
};
