import AuthenticatedLayoutClient from '@/components/AuthenticatedLayoutClient'

export default function AuthenticatedLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return <AuthenticatedLayoutClient>{children}</AuthenticatedLayoutClient>
}