"use client";

import React, { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  SidebarProvider,
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarTrigger,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarInset,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Home,
  PlusCircle,
  Settings,
  LogOut,
  ChevronDown,
  Share2,
} from "lucide-react";
import { CreateNoteDialog } from "@/components/create-note-dialog";
import { ThemeToggle } from "@/components/theme-toggle";

// Notice: we useProfile() & useAuth(), but DO NOT wrap <ProfileProvider> here.
import { useProfile } from "@/components/providers/ProfileProvider";
import { useAuth } from "@/components/providers/AuthProvider";

function SidebarFooterContent() {
  const { user } = useProfile(); // user is fetched at the top layout
  const { logout } = useAuth();
  const router = useRouter();

  const fullName = `${user.first_name} ${user.last_name}`;
  const initials = [user.first_name, user.last_name]
      .map((n) => n.charAt(0))
      .join("");

  const handleLogout = async () => {
    await logout();
    router.replace("/");
  };

  return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="w-full justify-start gap-2">
            <Avatar className="h-6 w-6 group-data-[collapsible=icon]:hidden">
              {user.profilePictureUrl ? (
                  <AvatarImage src={user.profilePictureUrl} alt={fullName} />
              ) : (
                  <AvatarFallback>{initials}</AvatarFallback>
              )}
            </Avatar>
            <span className="group-data-[collapsible=icon]:hidden">{fullName}</span>
            <ChevronDown className="ml-auto h-4 w-4 group-data-[collapsible=icon]:hidden" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuItem asChild>
            <a href="/dashboard/settings" className="flex items-center w-full">
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </a>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <button onClick={handleLogout} className="flex items-center w-full text-left">
              <LogOut className="mr-2 h-4 w-4" />
              Log out
            </button>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isCreateNoteOpen, setIsCreateNoteOpen] = useState(false);

  const getPageTitle = () => {
    if (pathname === "/dashboard") return "Dashboard";
    if (pathname === "/dashboard/shared") return "Shared with me";
    if (pathname === "/dashboard/settings") return "Settings";
    if (pathname.startsWith("/dashboard/note/")) return "Note";
    return "Dashboard";
  };

  return (
      // We keep all the same sidebar code
      <SidebarProvider>
        <div className="flex h-screen w-full overflow-hidden">
          <Sidebar variant="inset" collapsible="icon">
            <SidebarHeader className="flex items-center justify-between p-4">
              <div className="font-bold text-xl group-data-[collapsible=icon]:hidden">
                ShareNotes
              </div>
            </SidebarHeader>
            <SidebarContent>
              <SidebarGroup>
                <SidebarGroupLabel>Menu</SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    <SidebarMenuItem>
                      <SidebarMenuButton
                          asChild
                          isActive={pathname === "/dashboard"}
                          tooltip="Dashboard"
                      >
                        <a href="/dashboard">
                          <Home className="h-5 w-5" />
                          <span>Dashboard</span>
                        </a>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                      <SidebarMenuButton
                          asChild
                          isActive={pathname === "/dashboard/shared"}
                          tooltip="Shared with me"
                      >
                        <a href="/dashboard/shared">
                          <Share2 className="h-5 w-5" />
                          <span>Shared with me</span>
                        </a>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                      <SidebarMenuButton
                          asChild
                          isActive={pathname === "/dashboard/settings"}
                          tooltip="Settings"
                      >
                        <a href="/dashboard/settings">
                          <Settings className="h-5 w-5" />
                          <span>Settings</span>
                        </a>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            </SidebarContent>
            <SidebarFooter className="p-4">
              <SidebarFooterContent />
            </SidebarFooter>
          </Sidebar>

          <SidebarInset className="flex flex-col w-full h-full">
            <header className="border-b p-4 flex items-center shrink-0">
              <SidebarTrigger className="mr-2" />
              <div className="flex-1">
                <h1 className="text-xl font-bold group-data-[collapsible=icon]:hidden">
                  {getPageTitle()}
                </h1>
              </div>
              <ThemeToggle className="mr-2" />
              <Button onClick={() => setIsCreateNoteOpen(true)}>
                <PlusCircle className="mr-2 h-4 w-4" />
                New Note
              </Button>
            </header>

            <main className="flex-1 overflow-auto p-6 w-full h-full">
              {children}
            </main>
          </SidebarInset>
        </div>

        {/* The "New Note" dialog remains exactly as before */}
        <CreateNoteDialog open={isCreateNoteOpen} onOpenChange={setIsCreateNoteOpen} />
      </SidebarProvider>
  );
}
