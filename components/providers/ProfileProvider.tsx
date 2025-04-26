// components/providers/ProfileProvider.tsx
'use client';

import React, {
    createContext,
    useContext,
    useState,
    useEffect,
    ReactNode,
} from 'react';
import { useRouter } from 'next/navigation';
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

    const fetchUser = async () => {
        try {
            const res = await api.get<User>('/auth/whoami');
            setUser(res.data);
            console.log(res.data);
        } catch {
            setUser(null);
        } finally {
            setBootstrapped(true);
        }
    };

    useEffect(() => {
        fetchUser();
    }, []);


    useEffect(() => {
        if (bootstrapped && !user) {
            router.replace('/');
        }
    }, [bootstrapped, user, router]);


    if (!bootstrapped || !user) {
        return null;
    }

    return (
        <ProfileContext.Provider value={{ user, refresh: fetchUser }}>
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
