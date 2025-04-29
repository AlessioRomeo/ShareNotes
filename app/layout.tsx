import type React from "react"
import { Inter } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"
import "./globals.css"

// Note: We import BOTH AuthProvider + ProfileProvider at the top level
import { AuthProvider } from "@/components/providers/AuthProvider"
import { ProfileProvider } from "@/components/providers/ProfileProvider"

const inter = Inter({ subsets: ["latin"] })

export const metadata = {
    title: "Collaborative Notes App",
    description: "Share and collaborate on whiteboard notes",
    generator: "v0.dev",
}

export default function RootLayout({
                                       children,
                                   }: {
    children: React.ReactNode
}) {
    return (
        <html lang="en" suppressHydrationWarning>
        <body className={inter.className}>
        {/* Wrap with AuthProvider first, then ProfileProvider, then ThemeProvider */}
        <AuthProvider>
            <ProfileProvider>
                <ThemeProvider
                    attribute="class"
                    defaultTheme="light"
                    enableSystem={false}
                    disableTransitionOnChange
                >
                    {children}
                </ThemeProvider>
            </ProfileProvider>
        </AuthProvider>
        </body>
        </html>
    )
}
