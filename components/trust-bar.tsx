const directories = ["Google", "Bing", "Apple Maps", "Yelp", "Foursquare", "Yellow Pages", "MapQuest", "HERE", "Hotfrog", "Chamber of Commerce"]

export function TrustBar() {
  const items = [...directories, ...directories]
  return (
    <div className="fixed inset-x-0 bottom-0 z-50 overflow-hidden border-t border-slate-200 bg-white/95 py-3 shadow-[0_-8px_30px_-20px_rgba(15,23,42,.3)] backdrop-blur" aria-label="Supported citation directories">
      <div className="flex w-max animate-marquee items-center hover:[animation-play-state:paused]">
        {items.map((name, index) => (
          <div key={`${name}-${index}`} className="flex items-center gap-5 px-5 text-xs font-bold uppercase tracking-[.16em] text-slate-500">
            <span className="h-1.5 w-1.5 rounded-full bg-orange-500" />
            {name}
          </div>
        ))}
      </div>
    </div>
  )
}
