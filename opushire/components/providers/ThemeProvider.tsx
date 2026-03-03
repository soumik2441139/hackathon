"use client";

import React, { useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
    const { user } = useAuth();

    useEffect(() => {
        // Clear all theme classes
        document.body.classList.remove('theme-recruiter', 'theme-student', 'theme-admin');

        // Only apply a theme when someone is actually logged in
        if (user) {
            if (user.role === 'recruiter') {
                document.body.classList.add('theme-recruiter');
            } else if (user.role === 'student') {
                document.body.classList.add('theme-student');
            } else if (user.role === 'admin') {
                document.body.classList.add('theme-admin');
            }
        }
        // If no user is logged in, no class is added — :root defaults apply
    }, [user]);

    return <>{children}</>;
};
