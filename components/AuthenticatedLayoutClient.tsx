'use client'

import { ThemeProvider } from '@/providers/ThemeProvider'
import { Toaster } from '@/components/ui/Toaster'
import Sidebar from '@/components/dashboard/Sidebar'

export default function AuthenticatedLayoutClient({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <ThemeProvider>
            <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-purple-50/30 dark:from-gray-950 dark:via-gray-900 dark:to-purple-950/30 flex">
                {/* ✅ Sidebar on every page */}
                <Sidebar />

                {/* Main content */}
                <div className="flex-1 flex flex-col min-w-0">
                    <main className="flex-1">
                        {children}
                    </main>
                </div>

                <Toaster />
            </div>
        </ThemeProvider>
    )
}