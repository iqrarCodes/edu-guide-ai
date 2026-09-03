'use client'

import { usePathname } from 'next/navigation'
import { ThemeProvider } from '@/providers/ThemeProvider'   // ✅ Custom provider
import { Toaster } from '@/components/ui/Toaster'
import Navbar from '@/components/Navbar'

export default function AuthenticatedLayoutClient({
    children,
}: {
    children: React.ReactNode
}) {
    const pathname = usePathname()
    const hideNavbar = pathname === '/dashboard'

    return (
        <ThemeProvider>
            <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-purple-50/30 dark:from-gray-950 dark:via-gray-900 dark:to-purple-950/30">
                {!hideNavbar && <Navbar />}
                <main className={!hideNavbar ? 'pt-20' : ''}>{children}</main>
                <Toaster />
            </div>
        </ThemeProvider>
    )
}