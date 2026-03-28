export default function SettingsLoading() {
  return (
    <div className="min-h-screen flex flex-col animate-pulse">
      <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-cream-200 bg-white">
        <div className="h-5 w-28 bg-cream-200 rounded-lg" />
        <div className="h-8 w-24 bg-cream-200 rounded-full" />
      </div>
      <div className="flex-1 p-5 xl:p-6">
        <div className="max-w-2xl mx-auto space-y-5">
          <div className="h-10 w-48 bg-cream-100 rounded-xl" />
          <div className="bg-white rounded-2xl border border-cream-200 p-6 space-y-5">
            <div className="space-y-1.5">
              <div className="h-4 w-16 bg-cream-200 rounded" />
              <div className="h-6 w-48 bg-cream-100 rounded-lg" />
            </div>
            <div className="space-y-1.5">
              <div className="h-4 w-36 bg-cream-200 rounded" />
              <div className="h-11 bg-cream-100 rounded-xl" />
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <div className="h-4 w-20 bg-cream-200 rounded" />
                <div className="h-11 bg-cream-100 rounded-xl" />
              </div>
              <div className="space-y-1.5">
                <div className="h-4 w-16 bg-cream-200 rounded" />
                <div className="h-11 bg-cream-100 rounded-xl" />
              </div>
            </div>
            <div className="h-11 w-32 bg-cream-200 rounded-xl" />
          </div>
          <div className="bg-white rounded-2xl border border-cream-200 p-6 space-y-3">
            <div className="h-4 w-24 bg-cream-200 rounded" />
            <div className="h-3 w-48 bg-cream-100 rounded" />
            <div className="h-4 w-32 bg-cream-100 rounded" />
          </div>
        </div>
      </div>
    </div>
  )
}
