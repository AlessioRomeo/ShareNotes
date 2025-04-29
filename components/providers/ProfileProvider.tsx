"use client";

import React, {
    createContext,
    useContext,
    useState,
    useEffect,
    ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";

export interface User {
    _id: string;
    first_name: string;
    last_name: string;
    email: string;
    profilePictureUrl?: string;
}

interface ProfileContextType {
    user: User | null;
    refresh: () => Promise<void>;
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

export function ProfileProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [bootstrapped, setBootstrapped] = useState(false);

    const fetchUser = async () => {
        try {
            const res = await api.get<User>("/auth/whoami");
            setUser(res.data);
            console.log("Fetched user:", res.data);
        } catch (error) {
            // If request fails or user isn't logged in, set user to null
            setUser(null);
        } finally {
            setBootstrapped(true);
        }
    };

    useEffect(() => {
        fetchUser();
    }, []);

    // We REMOVE the automatic redirect to "/"
    // so sub-pages don't get forced out if there's a brief user fetch failure.

    // if you want to do some minimal check, do it here or in the pages themselves

    if (!bootstrapped) {
        // Still fetching or bootstrapping => show a loading spinner or empty
        return null;
    }

    if (!user) {
        // If there's no user, you can either:
        // 1) Return a minimal message or custom "Please log in" component
        // 2) Or just let the user see partial content
        // 3) Or do an immediate router.push("/") if you truly want them out
        // but that can cause the exact redirect issue again if the fetch is slow.

        return (
            <div className="flex h-screen items-center justify-center">
                <p className="text-sm text-muted-foreground">
                    You must be logged in to view this page.
                    <br />
                    <a href="/" className="underline">
                        Go to login
                    </a>
                </p>
            </div>
        );
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
        throw new Error("useProfile must be used within ProfileProvider");
    }
    return ctx;
}
