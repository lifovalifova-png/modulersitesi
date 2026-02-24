import { useRef, useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, MapPin, Clock, Flame } from 'lucide-react';
import { toast } from 'sonner';
import QuickQuoteModal from './QuickQuoteModal';
import { FLASH_DEALS, type FlashDeal } from '../data/flashDeals';

export default function FlashDealsCarousel() {
  const [selectedListing, setSelectedListing] = useState<FlashDeal | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScrollPosition = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  useEffect(() => {
    checkScrollPosition();
    const scrollContainer = scrollRef.current;
    if (!scrollContainer) return;
    scrollContainer.addEventListener('scroll', checkScrollPosition);
    return () => scrollContainer.removeEventListener('scroll', checkScrollPosition);
  }, []);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -320 : 320,
        behavior: 'smooth',
      });
    }
  };

  const openQuoteModal = (listing: FlashDeal) => {
    setSelectedListing(listing);
    setIsModalOpen(true);
  };

  const handleSuccess = () => {
    toast.success('Teklif talebiniz alındı! En kısa sürede sizinle iletişime geçeceğiz.');
  };

  return (
    <section className="py-12 md:py-16 bg-gradient-to-b from-amber-50 to-white">
      <div className="max-w-7xl mx-auto px-4">
        {/* Section Header */}
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-3">
            <div className="bg-red-500 text-white p-2 rounded-lg animate-pulse">
              <Flame className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-gray-800">
                Flaş Fırsatlar
              </h2>
              <p className="text-gray-600 text-sm flex items-center gap-1 mt-1">
                <Clock className="w-4 h-4" /> Sınırlı süreli indirimli ilanlar
              </p>
            </div>
          </div>

          {/* Navigation Buttons */}
          <div className="hidden md:flex gap-2">
            <button
              onClick={() => scroll('left')}
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
              onClick={() => scroll('right')}
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
        <div className="relative">
          <div
            ref={scrollRef}
            className="flex gap-4 overflow-x-auto scrollbar-hide pb-4 snap-x snap-mandatory"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {FLASH_DEALS.map((listing) => (
              <div
                key={listing.id}
                className="flex-shrink-0 w-72 sm:w-80 bg-white rounded-xl shadow-md overflow-hidden border border-gray-100 hover:shadow-lg transition-shadow snap-start"
              >
                {/* Image */}
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
                  <div className="absolute bottom-3 left-3 bg-black/60 text-white text-xs px-2 py-1 rounded">
                    {listing.category}
                  </div>
                </div>

                {/* Content */}
                <div className="p-4">
                  <h3 className="font-semibold text-gray-800 mb-2 line-clamp-2 min-h-[48px]">
                    {listing.title}
                  </h3>
                  <div className="flex items-center text-gray-500 text-sm mb-3">
                    <MapPin className="w-4 h-4 mr-1" aria-hidden="true" />
                    {listing.location}
                  </div>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <div className="text-lg font-bold text-emerald-600">
                        {listing.price}
                      </div>
                      {listing.originalPrice && (
                        <div className="text-sm text-gray-400 line-through">
                          {listing.originalPrice}
                        </div>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => openQuoteModal(listing)}
                    className="w-full bg-emerald-600 text-white py-2.5 rounded-lg font-medium hover:bg-emerald-700 transition"
                  >
                    Hızlı Teklif Al
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Scroll Indicators - Mobile */}
          <div className="flex justify-center gap-1 mt-4 md:hidden">
            {FLASH_DEALS.slice(0, 5).map((_, index) => (
              <div key={index} className="w-2 h-2 rounded-full bg-gray-300" />
            ))}
          </div>
        </div>
      </div>

      {/* Quick Quote Modal */}
      {selectedListing && (
        <QuickQuoteModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          listing={selectedListing}
          onSuccess={handleSuccess}
        />
      )}
    </section>
  );
}
