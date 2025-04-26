'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '@/lib/api';

interface SignupData {
    username: string;
    password: string;
    email: string;
    firstName: string;
    lastName: string;
    profilePictureUrl?: string;
}

interface SessionContextType {
    token: string | null;
    login: (email: string, password: string) => Promise<void>;
    logout:  () => Promise<void>;
    signup: (data: SignupData) => Promise<void>;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [token, setToken] = useState<string | null>(null);
    const [bootstrapped, setBootstrapped] = useState(false);

    useEffect(() => {
        if (typeof window === 'undefined') return;
        const stored = localStorage.getItem('token');
        setToken(stored);
        setBootstrapped(true);
    }, []);

    useEffect(() => {
        if (!bootstrapped) return;
        if (token) {
            api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        } else {
            delete api.defaults.headers.common['Authorization'];
        }
    }, [token, bootstrapped]);

    const login = async (email: string, password: string) => {
        const res = await api.post('/auth/login', { email, password });
        const newToken = res.data.token;
        if (!newToken) throw new Error('Login failed');
        localStorage.setItem('token', newToken);
        setToken(newToken);
    };

    const logout = async () => {
        const res = await api.delete('/auth/logout');
        localStorage.removeItem('token');
        setToken(null);
    };

    const signup = async (data: SignupData) => {
        const res = await api.post('/auth/signup', data);
        if (res.status !== 201) throw new Error('Signup failed');
    };


    if (!bootstrapped) return null;

    return (
        <SessionContext.Provider value={{ token, login, logout, signup }}>
            {children}
        </SessionContext.Provider>
    );
}

export function useAuth() {
    const ctx = useContext(SessionContext);
    if (!ctx) throw new Error('useAuth must be used within AuthProvider');
    return ctx;
}
