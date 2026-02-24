import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { MapPin, Filter, Grid, List, ChevronDown } from 'lucide-react';
import QuickQuoteModal from '../components/QuickQuoteModal';
import { CATEGORY_NAMES } from '../data/categories';

const sampleListings = [
  {
    id: 1,
    title: "80 m² Prefabrik Ev - Sıfır, Anahtar Teslim",
    location: 'Ankara',
    price: '320.000 ₺',
    image: 'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=400&h=300&fit=crop',
    category: 'Prefabrik',
    date: '2 gün önce'
  },
  {
    id: 2,
    title: "Kütahya'da 2 Adet Konteyner - ACİL SATILIK",
    location: 'Kütahya',
    price: '145.000 ₺',
    image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop',
    category: 'Yaşam Konteynerleri',
    date: '3 gün önce'
  },
  {
    id: 3,
    title: 'Tiny House 35 m² - Mobilyalı',
    location: 'İzmir',
    price: '280.000 ₺',
    image: 'https://images.unsplash.com/photo-1587061949409-02df41d5e562?w=400&h=300&fit=crop',
    category: 'Tiny House',
    date: '1 hafta önce'
  },
  {
    id: 4,
    title: 'Çelik Konstrüksiyon Depo 200 m²',
    location: 'Bursa',
    price: '450.000 ₺',
    image: 'https://images.unsplash.com/photo-1565610222536-ef125c59da2e?w=400&h=300&fit=crop',
    category: 'Çelik Yapılar',
    date: '5 gün önce'
  },
  {
    id: 5,
    title: '2. El Şantiye Konteyneri - 6m',
    location: 'İstanbul',
    price: '75.000 ₺',
    image: 'https://images.unsplash.com/photo-1494145904049-0dca59b4bbad?w=400&h=300&fit=crop',
    category: '2. El',
    date: '1 gün önce'
  },
  {
    id: 6,
    title: 'Ahşap Bungalov 60 m² - Doğal',
    location: 'Antalya',
    price: '520.000 ₺',
    image: 'https://images.unsplash.com/photo-1449158743715-0a90ebb6d2d8?w=400&h=300&fit=crop',
    category: 'Ahşap Yapılar',
    date: '4 gün önce'
  }
];

export default function CategoryPage() {
  const { slug } = useParams<{ slug: string }>();
  const [selectedListing, setSelectedListing] = useState<typeof sampleListings[0] | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState('newest');

  const categoryName = CATEGORY_NAMES[slug ?? ''] ?? 'İlanlar';

  const openQuoteModal = (listing: typeof sampleListings[0]) => {
    setSelectedListing(listing);
    setIsModalOpen(true);
  };

  return (
    <div className="py-6 md:py-8 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
          <Link to="/" className="hover:text-emerald-600">Ana Sayfa</Link>
          <span>/</span>
          <span className="text-gray-800">{categoryName}</span>
        </div>

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800">{categoryName}</h1>
            <p className="text-gray-500 mt-1">{sampleListings.length} ilan bulundu</p>
          </div>

          <div className="flex items-center gap-3">
            {/* View Mode Toggle */}
            <div className="hidden md:flex items-center border border-gray-300 rounded-lg overflow-hidden">
              <button
                onClick={() => setViewMode('grid')}
                aria-label="Izgara görünümü"
                aria-pressed={viewMode === 'grid'}
                className={`p-2 ${viewMode === 'grid' ? 'bg-emerald-50 text-emerald-600' : 'text-gray-500 hover:bg-gray-50'}`}
              >
                <Grid className="w-5 h-5" aria-hidden="true" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                aria-label="Liste görünümü"
                aria-pressed={viewMode === 'list'}
                className={`p-2 ${viewMode === 'list' ? 'bg-emerald-50 text-emerald-600' : 'text-gray-500 hover:bg-gray-50'}`}
              >
                <List className="w-5 h-5" aria-hidden="true" />
              </button>
            </div>

            {/* Sort Dropdown */}
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="newest">En Yeni</option>
                <option value="price_asc">Fiyat (Düşük-Yüksek)</option>
                <option value="price_desc">Fiyat (Yüksek-Düşük)</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
            </div>

            {/* Filter Button */}
            <button className="flex items-center gap-2 bg-white border border-gray-300 rounded-lg px-4 py-2 hover:bg-gray-50 transition">
              <Filter className="w-4 h-4" />
              <span>Filtrele</span>
            </button>
          </div>
        </div>

        {/* Listings Grid */}
        <div className={`grid gap-4 ${viewMode === 'grid' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}>
          {sampleListings.map((listing) => (
            <div
              key={listing.id}
              className={`bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition ${
                viewMode === 'list' ? 'flex' : ''
              }`}
            >
              {/* Image */}
              <div className={`relative ${viewMode === 'list' ? 'w-48 flex-shrink-0' : 'h-48'}`}>
                <img
                  src={listing.image}
                  alt={`${listing.title} — ${listing.location}`}
                  loading="lazy"
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded">
                  {listing.category}
                </div>
              </div>

              {/* Content */}
              <div className="p-4 flex-1">
                <h3 className="font-semibold text-gray-800 mb-2 line-clamp-2">
                  {listing.title}
                </h3>
                <div className="flex items-center text-gray-500 text-sm mb-2">
                  <MapPin className="w-4 h-4 mr-1" />
                  {listing.location}
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-lg font-bold text-emerald-600">
                      {listing.price}
                    </div>
                    <div className="text-xs text-gray-400">{listing.date}</div>
                  </div>
                  <button
                    onClick={() => openQuoteModal(listing)}
                    className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-emerald-700 transition"
                  >
                    Teklif Al
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Load More */}
        <div className="text-center mt-8">
          <button className="bg-white border border-gray-300 text-gray-700 px-8 py-3 rounded-lg font-medium hover:bg-gray-50 transition">
            Daha Fazla Yükle
          </button>
        </div>
      </div>

      {/* Quick Quote Modal */}
      {selectedListing && (
        <QuickQuoteModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          listing={selectedListing}
        />
      )}
    </div>
  );
}
