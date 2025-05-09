"use client";

import type React from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {LoginRequest} from "@/types/auth";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/components/providers/AuthProvider";

type tabState = "login" | "signup"
export function AuthForm() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const {toast} = useToast();
    const {login, signup} = useAuth();
    const [activeTab, setActiveTab] = useState<tabState>("login")

    // Handle the Login form
    const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true);

        const formData = new FormData(e.currentTarget);
        const loginData: LoginRequest = {
            email: formData.get("email") as string,
            password: formData.get("password") as string,
        };
        const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
            e.preventDefault()
            setIsLoading(true)
            const formData = new FormData(e.currentTarget)
            const loginData: LoginRequest = {
                email: formData.get("email") as string,
                password: formData.get("password") as string,
            }

            try {
                await login(loginData.email, loginData.password);
                setIsLoading(false);
                router.push("/dashboard");
            } catch (err) {
                if (err instanceof Error) {
                    toast({
                        title: "Error logging in",
                        description: err.message,
                    });
                    setIsLoading(false);
                }
                try {
                    await login(loginData.email, loginData.password)
                    router.push("/dashboard")
                } catch (err) {
                    toast({title: "Error logging in", description: (err as Error).message})
                } finally {
                    setIsLoading(false)
                }
            }
        };

        // Handle the Signup form
        const handleSignup = async (e: React.FormEvent<HTMLFormElement>) => {
            e.preventDefault();
            setIsLoading(true);

            const formData = new FormData(e.currentTarget);
            const fullName = (formData.get("name") as string).trim();
            const email = formData.get("email-signup") as string;
            const password = formData.get("password-signup") as string;
            const confirmPassword = formData.get("confirm-password") as string;

            // Basic client-side check
            if (password !== confirmPassword) {
                toast({
                    title: "Passwords do not match",
                    description: "Please confirm your password correctly.",
                });
                setIsLoading(false);
                return;
            }

            // Split fullName -> firstName, lastName
            const [firstName, ...rest] = fullName.split(" ");
            const lastName = rest.join(" ");
            const handleSignup = async (e: React.FormEvent<HTMLFormElement>) => {
                e.preventDefault()
                setIsLoading(true)
                const formData = new FormData(e.currentTarget)
                const signupData = {
                    name: formData.get("name") as string,
                    email: formData.get("email-signup") as string,
                    password: formData.get("password-signup") as string,
                }

                try {
                    // We'll set username = email, but you can pick something else if you want
                    await signup({
                        username: email,
                        email,
                        password,
                        firstName: firstName || "",
                        lastName: lastName || "",
                    });
                    setIsLoading(false);
                    toast({
                        title: "Account created",
                        description: "Your account was created successfully. You can now log in.",
                    });
                } catch (err) {
                    if (err instanceof Error) {
                        toast({
                            title: "Error creating account",
                            description: err.message,
                        });
                    }
                } finally {
                    setIsLoading(false);
                    try {
                        await signup({
                            firstName: signupData.name,
                            lastName: signupData.name,
                            email: signupData.email,
                            username: signupData.email,
                            password: signupData.password,
                        })
                        setActiveTab("login")
                        toast({title: "Account created!", description: "Please log in."})
                    } catch (err) {
                        toast({title: "Error creating account", description: (err as Error).message})
                    } finally {
                        setIsLoading(false)
                    }
                }
            };
            return (
                <Card className="w-full">
                    <CardHeader className="space-y-1">
                        <CardTitle className="text-2xl font-bold text-center">ShareNotes</CardTitle>
                        <CardDescription className="text-center">
                            Create, share, and collaborate on whiteboard notes
                        </CardDescription>
                    </CardHeader>

                    <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as tabState)}
                          className="w-full">
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="login">Login</TabsTrigger>
                            <TabsTrigger value="signup">Sign Up</TabsTrigger>
                        </TabsList>

                        <TabsContent value="login">
                            <form onSubmit={handleLogin}>
                                <CardContent className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="email">Email</Label>
                                        <Input id="email" name="email" type="email" placeholder="m@example.com"
                                               required/>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <Label htmlFor="password">Password</Label>
                                            <Button variant="link" className="px-0 text-xs font-normal h-auto">
                                                Forgot password?
                                            </Button>
                                        </div>
                                        <Input id="password" name="password" type="password" required/>
                                    </div>
                                </CardContent>
                                <CardFooter>
                                    <Button type="submit" className="w-full" disabled={isLoading}>
                                        {isLoading ? "Logging in..." : "Login"}
                                    </Button>
                                </CardFooter>
                            </form>
                        </TabsContent>

                        <TabsContent value="signup">
                            <form onSubmit={handleSignup}>
                                <CardContent className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="name">Full Name</Label>
                                        <Input id="name" name="name" placeholder="John Doe" required/>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="email-signup">Email</Label>
                                        <Input id="email-signup" name="email-signup" type="email"
                                             placeholder="m@example.com" required/>
                                  </div>
                                  <div className="space-y-2">
                                      <Label htmlFor="password-signup">Password</Label>
                                      <Input id="password-signup" name="password-signup" type="password" required/>
                                  </div>
                                  <div className="space-y-2">
                                      <Label htmlFor="confirm-password">Confirm Password</Label>
                                      <Input id="confirm-password" name="confirm-password" type="password" required/>
                                  </div>
                              </CardContent>
                              <CardFooter>
                                  <Button type="submit" className="w-full" disabled={isLoading}>
                                      {isLoading ? "Creating account..." : "Create account"}
                                  </Button>
                              </CardFooter>
                          </form>
                      </TabsContent>
                  </Tabs>
              </Card>
          )
      }
  }}

