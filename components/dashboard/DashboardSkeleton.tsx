export function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-purple-50/30 flex">
      <div className="hidden lg:block w-72 bg-white/80 border-r border-gray-200/50 p-6 animate-pulse">
        <div className="h-8 w-32 bg-gray-200 rounded mb-4" />
        <div className="space-y-3">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-10 bg-gray-200 rounded-xl" />
          ))}
        </div>
      </div>
      <div className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full animate-pulse">
        <div className="h-32 bg-gradient-to-r from-purple-100 to-indigo-100 rounded-3xl mb-8" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 bg-gray-200 rounded-2xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-48 bg-gray-200 rounded-2xl" />
          ))}
        </div>
        <div className="h-56 bg-gray-200 rounded-2xl" />
      </div>
    </div>
  )
}