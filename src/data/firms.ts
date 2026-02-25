export interface Firm {
  id: number;
  name: string;
  category: string;
  city: string;
  address: string;
  phone: string;
  lat: number;
  lng: number;
  verified: boolean;
}

export const FIRMS: Firm[] = [
  { id: 1,  name: 'Anadolu Prefabrik',        category: 'Prefabrik',           city: 'Ankara',    address: 'Ostim Sanayi, Ankara',           phone: '0312 111 22 33', lat: 39.9334, lng: 32.8597, verified: true  },
  { id: 2,  name: 'İstanbul Konteyner A.Ş.',  category: 'Yaşam Konteynerleri', city: 'İstanbul',  address: 'Dudullu OSB, Ümraniye',           phone: '0216 444 55 66', lat: 41.0082, lng: 29.0222, verified: true  },
  { id: 3,  name: 'Ege Tiny House',            category: 'Tiny House',          city: 'İzmir',     address: 'Torbalı Sanayi, İzmir',           phone: '0232 333 44 55', lat: 38.4192, lng: 27.1287, verified: true  },
  { id: 4,  name: 'Bursalı Çelik Yapılar',    category: 'Çelik Yapılar',       city: 'Bursa',     address: 'Nilüfer OSB, Bursa',              phone: '0224 222 33 44', lat: 40.1885, lng: 29.0610, verified: true  },
  { id: 5,  name: 'Akdeniz Ahşap Evler',      category: 'Ahşap Yapılar',       city: 'Antalya',   address: 'Kepez Sanayi, Antalya',           phone: '0242 555 66 77', lat: 36.8969, lng: 30.7133, verified: false },
  { id: 6,  name: 'Muğla Bungalov',           category: 'Ahşap Yapılar',       city: 'Muğla',     address: 'Bodrum Yolu, Muğla',              phone: '0252 444 33 22', lat: 37.2153, lng: 28.3636, verified: true  },
  { id: 7,  name: 'Konya Prefabrik Sistem',   category: 'Prefabrik',           city: 'Konya',     address: 'Selçuklu Sanayi, Konya',          phone: '0332 666 77 88', lat: 37.8714, lng: 32.4846, verified: true  },
  { id: 8,  name: 'Kocaeli Modüler',          category: 'Yaşam Konteynerleri', city: 'Kocaeli',   address: 'Gebze OSB, Kocaeli',              phone: '0262 333 22 11', lat: 40.7654, lng: 29.9408, verified: true  },
  { id: 9,  name: 'Gaziantep Çelik A.Ş.',     category: 'Çelik Yapılar',       city: 'Gaziantep', address: 'İslahiye Sanayi, Gaziantep',      phone: '0342 777 88 99', lat: 37.0662, lng: 37.3833, verified: false },
  { id: 10, name: 'Trabzon Ahşap Mimari',     category: 'Ahşap Yapılar',       city: 'Trabzon',   address: 'Ortahisar, Trabzon',              phone: '0462 222 11 00', lat: 41.0027, lng: 39.7168, verified: true  },
  { id: 11, name: 'Mersin Konteyner Park',    category: 'Yaşam Konteynerleri', city: 'Mersin',    address: 'Tarsus OSB, Mersin',              phone: '0324 555 44 33', lat: 36.8121, lng: 34.6415, verified: true  },
  { id: 12, name: 'Samsun Prefabrik Ltd.',    category: 'Prefabrik',           city: 'Samsun',    address: '19 Mayıs Sanayi, Samsun',         phone: '0362 444 55 66', lat: 41.2867, lng: 36.3300, verified: true  },
  { id: 13, name: 'Eskişehir Tiny Living',    category: 'Tiny House',          city: 'Eskişehir', address: 'Tepebaşı, Eskişehir',             phone: '0222 666 77 88', lat: 39.7767, lng: 30.5206, verified: false },
  { id: 14, name: 'Kayseri Modüler Yapı',     category: 'Özel Projeler',       city: 'Kayseri',   address: 'Melikgazi Sanayi, Kayseri',       phone: '0352 333 44 55', lat: 38.7312, lng: 35.4787, verified: true  },
  { id: 15, name: 'Diyarbakır Çelik Ev',      category: 'Çelik Yapılar',       city: 'Diyarbakır',address: 'Bağlar Sanayi, Diyarbakır',       phone: '0412 111 22 33', lat: 37.9144, lng: 40.2306, verified: true  },
];
