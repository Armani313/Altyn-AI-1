export default function DashboardLoading() {
  return (
    <div className="min-h-screen flex flex-col animate-pulse">
      <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-cream-200 bg-white">
        <div className="space-y-2">
          <div className="h-5 w-40 bg-cream-200 rounded-lg" />
          <div className="h-3 w-64 bg-cream-100 rounded-lg hidden sm:block" />
        </div>
        <div className="h-8 w-24 bg-cream-200 rounded-full" />
      </div>
      <div className="flex-1 p-5 xl:p-6">
        <div className="max-w-[1400px] mx-auto grid grid-cols-1 lg:grid-cols-3 gap-5">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex flex-col gap-3">
              <div className="flex items-center gap-2.5 px-1">
                <div className="w-6 h-6 rounded-full bg-cream-200" />
                <div className="h-4 w-32 bg-cream-200 rounded-lg" />
              </div>
              <div className="bg-white rounded-2xl border border-cream-200 aspect-square sm:aspect-auto sm:h-80 lg:h-[calc(100vh-200px)]" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
