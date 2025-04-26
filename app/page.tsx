"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AuthForm } from "@/components/auth-form";
import { useAuth } from "@/components/providers/AuthProvider";

export default function Home() {
    const { token } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (token) {
            router.replace("/dashboard");
        }
    }, [token, router]);


    if (token) {
        return null;
    }

    return (
        <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-gradient-to-b from-background to-muted/50">
            <div className="w-full max-w-md">
                <AuthForm />
            </div>
        </main>
    );
}
