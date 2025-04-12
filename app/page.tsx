import { AuthForm } from "@/components/auth-form"

export default function Home() {
  // In a real app, we would check if the user is authenticated
  // If authenticated, redirect to /dashboard
  // For demo purposes, we'll just show the auth form

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-gradient-to-b from-background to-muted/50">
      <div className="w-full max-w-md">
        <AuthForm />
      </div>
    </main>
  )
}

