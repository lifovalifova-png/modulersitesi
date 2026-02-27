import { useRef, useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, MapPin, Clock, Flame, Tag } from 'lucide-react';
import { FLASH_DEALS } from '../data/flashDeals';

/* Kategori → renk eşlemesi */
const CATEGORY_COLORS: Record<string, string> = {
  'Prefabrik':           'bg-emerald-100 text-emerald-700',
  'Yaşam Konteynerleri': 'bg-blue-100 text-blue-700',
  'Tiny House':          'bg-purple-100 text-purple-700',
  'Çelik Yapılar':       'bg-gray-200 text-gray-700',
  'Ahşap Yapılar':       'bg-amber-100 text-amber-700',
  'Özel Projeler':       'bg-pink-100 text-pink-700',
  '2. El':               'bg-orange-100 text-orange-700',
};

const AUTO_SCROLL_INTERVAL = 3000;
const CARD_WIDTH = 320 + 16; // w-80 + gap-4

export default function FlashDealsCarousel() {
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollRef    = useRef<HTMLDivElement>(null);
  const autoScrollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isPausedRef  = useRef(false);

  /* ── Scroll helpers ─────────────────────────────────────── */
  const scrollToIndex = useCallback((index: number) => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollTo({ left: index * CARD_WIDTH, behavior: 'smooth' });
    setActiveIndex(index);
  }, []);

  const scrollBy = useCallback((direction: 'left' | 'right') => {
    const total = FLASH_DEALS.length;
    setActiveIndex((prev) => {
      const next =
        direction === 'right'
          ? (prev + 1) % total
          : (prev - 1 + total) % total;
      scrollToIndex(next);
      return next;
    });
  }, [scrollToIndex]);

  /* ── Auto-scroll ────────────────────────────────────────── */
  const startAutoScroll = useCallback(() => {
    if (autoScrollRef.current) clearInterval(autoScrollRef.current);
    autoScrollRef.current = setInterval(() => {
      if (!isPausedRef.current) scrollBy('right');
    }, AUTO_SCROLL_INTERVAL);
  }, [scrollBy]);

  useEffect(() => {
    startAutoScroll();
    return () => { if (autoScrollRef.current) clearInterval(autoScrollRef.current); };
  }, [startAutoScroll]);

  /* ── Sync dot indicator ──────────────────────────────────── */
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const onScroll = () => setActiveIndex(Math.round(el.scrollLeft / CARD_WIDTH));
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, []);

  const canScrollLeft  = activeIndex > 0;
  const canScrollRight = activeIndex < FLASH_DEALS.length - 1;

  return (
    <section className="py-12 md:py-16 bg-gradient-to-b from-amber-50 to-white">
      <div className="max-w-7xl mx-auto px-4">

        {/* Section Header */}
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-3">
            <div className="bg-red-500 text-white p-2 rounded-lg animate-pulse">
              <Flame className="w-6 h-6" aria-hidden="true" />
            </div>
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-gray-800">Flaş Fırsatlar</h2>
              <p className="text-gray-600 text-sm flex items-center gap-1 mt-1">
                <Clock className="w-4 h-4" aria-hidden="true" /> Sınırlı süreli indirimli ilanlar
              </p>
            </div>
          </div>

          {/* Nav Buttons */}
          <div className="hidden md:flex gap-2">
            <button
              onClick={() => { scrollBy('left'); startAutoScroll(); }}
              disabled={!canScrollLeft}
              aria-label="Önceki ilanlar"
              className={`p-2 rounded-full border transition ${
                canScrollLeft
                  ? 'border-gray-300 hover:bg-emerald-50 hover:border-emerald-300 text-gray-600 hover:text-emerald-600'
                  : 'border-gray-200 text-gray-300 cursor-not-allowed'
              }`}
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={() => { scrollBy('right'); startAutoScroll(); }}
              disabled={!canScrollRight}
              aria-label="Sonraki ilanlar"
              className={`p-2 rounded-full border transition ${
                canScrollRight
                  ? 'border-gray-300 hover:bg-emerald-50 hover:border-emerald-300 text-gray-600 hover:text-emerald-600'
                  : 'border-gray-200 text-gray-300 cursor-not-allowed'
              }`}
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Carousel */}
        <div
          className="relative"
          onMouseEnter={() => { isPausedRef.current = true; }}
          onMouseLeave={() => { isPausedRef.current = false; }}
        >
          <div
            ref={scrollRef}
            className="flex gap-4 overflow-x-auto scrollbar-hide pb-4 snap-x snap-mandatory"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {FLASH_DEALS.map((listing) => {
              const badgeClass = CATEGORY_COLORS[listing.category] ?? 'bg-gray-100 text-gray-600';
              return (
                <div
                  key={listing.id}
                  className="flex-shrink-0 w-72 sm:w-80 bg-white rounded-xl shadow-md overflow-hidden border border-gray-100 hover:shadow-lg transition-shadow snap-start flex flex-col"
                >
                  {/* Image */}
                  <Link to={`/ilan/${listing.id}`} className="block">
                    <div className="relative h-48">
                      <img
                        src={listing.image}
                        alt={`${listing.title} — ${listing.location}`}
                        loading="lazy"
                        className="w-full h-full object-cover"
                      />
                      {listing.urgent && (
                        <div className="absolute top-3 left-3 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">
                          ACİL
                        </div>
                      )}
                      {listing.discount && (
                        <div className="absolute top-3 right-3 bg-amber-500 text-white text-xs font-bold px-2 py-1 rounded">
                          %{listing.discount} İNDİRİM
                        </div>
                      )}
                    </div>
                  </Link>

                  {/* Content */}
                  <div className="p-4 flex flex-col flex-1">
                    {/* Badges */}
                    <div className="flex items-center gap-1.5 mb-2 flex-wrap">
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                        <MapPin className="w-3 h-3" aria-hidden="true" />
                        {listing.location}
                      </span>
                      <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${badgeClass}`}>
                        <Tag className="w-3 h-3" aria-hidden="true" />
                        {listing.category}
                      </span>
                    </div>

                    <Link to={`/ilan/${listing.id}`} className="font-semibold text-gray-800 mb-3 line-clamp-2 min-h-[48px] hover:text-emerald-600 transition text-sm">
                      {listing.title}
                    </Link>

                    <div className="flex items-center justify-between mb-4 mt-auto">
                      <div>
                        <div className="text-lg font-bold text-emerald-600">{listing.price}</div>
                        {listing.originalPrice && (
                          <div className="text-sm text-gray-400 line-through">{listing.originalPrice}</div>
                        )}
                      </div>
                    </div>

                    <Link
                      to={`/ilan/${listing.id}`}
                      className="w-full bg-emerald-600 text-white py-2.5 rounded-lg font-medium hover:bg-emerald-700 transition text-center text-sm"
                    >
                      Teklif Al
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Dot Indicators */}
          <div className="flex justify-center gap-1.5 mt-4">
            {FLASH_DEALS.map((_, i) => (
              <button
                key={i}
                onClick={() => { scrollToIndex(i); startAutoScroll(); }}
                aria-label={`${i + 1}. ilana git`}
                className={`rounded-full transition-all duration-300 ${
                  i === activeIndex ? 'w-5 h-2 bg-emerald-500' : 'w-2 h-2 bg-gray-300 hover:bg-gray-400'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
