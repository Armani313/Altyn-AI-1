export default function LibraryLoading() {
  return (
    <div className="min-h-screen flex flex-col animate-pulse">
      {/* Header skeleton */}
      <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-cream-200 bg-white">
        <div className="space-y-2">
          <div className="h-5 w-28 bg-cream-200 rounded-lg" />
          <div className="h-3 w-52 bg-cream-100 rounded-lg hidden sm:block" />
        </div>
        <div className="h-8 w-24 bg-cream-200 rounded-full" />
      </div>

      <div className="flex-1 p-5 xl:p-6">
        <div className="max-w-6xl mx-auto">
          {/* Count line */}
          <div className="h-4 w-24 bg-cream-200 rounded-lg mb-5" />

          {/* Image grid skeleton */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4">
            {Array.from({ length: 15 }).map((_, i) => (
              <div
                key={i}
                className="bg-white rounded-2xl border border-cream-200 overflow-hidden"
              >
                <div className="aspect-square bg-gradient-to-br from-cream-100 to-cream-200" />
                <div className="p-2.5 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="h-3 w-14 bg-cream-200 rounded-full" />
                    <div className="h-3 w-10 bg-cream-100 rounded-full" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
