"use client";

import { useState } from "react";
import { Menu } from "lucide-react";
import { AppSidebar } from "@/components/dashboard/app-sidebar";

export function DashboardLayoutClient({ children }: { children: React.ReactNode }) {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    return (
        <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
            {/* Mobile header with hamburger */}
            <header className="fixed top-0 left-0 right-0 z-30 flex h-14 items-center border-b bg-card px-4 md:hidden">
                <button
                    onClick={() => setSidebarOpen(true)}
                    className="rounded-lg p-2 hover:bg-accent"
                    aria-label="Abrir menú"
                >
                    <Menu className="h-6 w-6" />
                </button>
                <span className="ml-3 font-semibold">Presupuesto</span>
            </header>

            <AppSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

            <main
                className="min-h-screen pt-14 md:pt-0 md:pl-64"
                role="main"
            >
                <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
                    {children}
                </div>
            </main>
        </div>
    );
}
