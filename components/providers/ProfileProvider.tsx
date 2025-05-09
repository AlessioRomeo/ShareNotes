'use client';

import React, {
    createContext,
    useContext,
    useState,
    useEffect,
    ReactNode,
} from 'react';
import {redirect, useRouter} from 'next/navigation';
import api from '@/lib/api';

export interface User {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    profilePictureUrl?: string;
}

interface ProfileContextType {
    user: User;
    refresh: () => Promise<void>;
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

export function ProfileProvider({ children }: { children: ReactNode }) {
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [bootstrapped, setBootstrapped] = useState(false);

    // 1) Fetch user once
    const fetchUser = async () => {
        try {
            const res = await api.get<User>('/auth/whoami');
            setUser(res.data);
        } catch {
            setUser(null);
        } finally {
            setBootstrapped(true);
        }
    };

    useEffect(() => {
        fetchUser();
    }, []);

    // 2) Redirect ONLY in an effect, never during render
    useEffect(() => {
        if (bootstrapped && user === null) {
            redirect("/")
        }
    }, [bootstrapped, user]);

    // 3a) While we’re waiting to know who the user is...
    if (!bootstrapped) {
        return <div>Loading…</div>;
    }

    // 3b) If bootstrapped but we have no user, bail out (the effect will redirect)
    if (bootstrapped && user === null) {
        return null;
    }

    // 3c) We have a user → render children
    return (
        <ProfileContext.Provider value={{ user: user!, refresh: fetchUser }}>
            {children}
        </ProfileContext.Provider>
    );
}

export function useProfile() {
    const ctx = useContext(ProfileContext);
    if (!ctx) {
        throw new Error('useProfile must be used within ProfileProvider');
    }
    return ctx;
}
