export interface Category {
  slug: string;
  name: string;
  fullName: string;
  count: number;
  color: string;
}

export const CATEGORIES: Category[] = [
  { slug: 'prefabrik',           name: 'Prefabrik',             fullName: 'Prefabrik Evler',       count: 234, color: 'bg-blue-500'   },
  { slug: 'celik-yapilar',       name: 'Çelik Yapılar',         fullName: 'Çelik Yapılar',         count: 156, color: 'bg-gray-600'   },
  { slug: 'yasam-konteynerleri', name: 'Yaşam Konteynerleri',   fullName: 'Yaşam Konteynerleri',   count: 189, color: 'bg-orange-500' },
  { slug: 'ikinci-el',           name: '2. El',                 fullName: '2. El İlanlar',         count: 312, color: 'bg-amber-500'  },
  { slug: 'ozel-projeler',       name: 'Özel Projeler',         fullName: 'Özel Projeler',         count: 87,  color: 'bg-purple-500' },
  { slug: 'ahsap-yapilar',       name: 'Ahşap Yapılar',         fullName: 'Ahşap Yapılar',         count: 143, color: 'bg-green-600'  },
  { slug: 'tiny-house',          name: 'Tiny House',            fullName: 'Tiny House',            count: 201, color: 'bg-emerald-500'},
];

export const CATEGORY_NAMES: Record<string, string> = Object.fromEntries(
  CATEGORIES.map((c) => [c.slug, c.fullName])
);
