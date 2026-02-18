"use client";

import { useState } from "react";
import { Menu } from "lucide-react";
import { AppSidebar } from "@/components/dashboard/app-sidebar";
import { NotificationBell } from "@/components/notifications/notification-bell";
import { UsernamePromptModal } from "@/components/social/username-prompt-modal";

export function DashboardLayoutClient({ children }: { children: React.ReactNode }) {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    return (
        <div className="min-h-screen min-h-[100dvh] bg-gradient-to-b from-background to-muted/30">
            <UsernamePromptModal />
            {/* Mobile header with hamburger and notifications */}
            <header className="fixed top-0 left-0 right-0 z-30 flex h-14 items-center justify-between border-b bg-card px-4 pt-[env(safe-area-inset-top)] md:hidden">
                <div className="flex items-center">
                    <button
                        onClick={() => setSidebarOpen(true)}
                        className="rounded-lg p-2 hover:bg-accent"
                        aria-label="Abrir menú"
                    >
                        <Menu className="h-6 w-6" />
                    </button>
                    <span className="ml-3 font-semibold">Presupuesto</span>
                </div>
                <NotificationBell />
            </header>

            {/* Desktop top bar with notifications (alineada al sidebar, no flotante) */}
            <div className="fixed top-0 right-0 left-0 z-20 hidden h-14 items-center justify-end border-b bg-card px-4 pt-[env(safe-area-inset-top)] md:flex md:left-64">
                <NotificationBell />
            </div>

            <AppSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

            <main
                className="min-h-screen min-w-0 overflow-x-hidden pt-[calc(3.5rem+env(safe-area-inset-top))] md:pt-[calc(3.5rem+env(safe-area-inset-top))] md:pl-64"
                role="main"
            >
                <div className="mx-auto min-w-0 w-full max-w-6xl overflow-x-hidden px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
                    {children}
                </div>
            </main>
        </div>
    );
}
