export interface Category {
  slug: string;
  name: string;
  fullName: string;
  color: string;
}

export const CATEGORIES: Category[] = [
  { slug: 'prefabrik',           name: 'Prefabrik',             fullName: 'Prefabrik Evler',       color: 'bg-blue-500'   },
  { slug: 'celik-yapilar',       name: 'Çelik Yapılar',         fullName: 'Çelik Yapılar',         color: 'bg-gray-600'   },
  { slug: 'yasam-konteynerleri', name: 'Yaşam Konteynerleri',   fullName: 'Yaşam Konteynerleri',   color: 'bg-orange-500' },
  { slug: 'ikinci-el',           name: '2. El',                 fullName: '2. El İlanlar',         color: 'bg-amber-500'  },
  { slug: 'ozel-projeler',       name: 'Özel Projeler',         fullName: 'Özel Projeler',         color: 'bg-purple-500' },
  { slug: 'ahsap-yapilar',       name: 'Ahşap Yapılar',         fullName: 'Ahşap Yapılar',         color: 'bg-green-600'  },
  { slug: 'tiny-house',          name: 'Tiny House',            fullName: 'Tiny House',            color: 'bg-emerald-500'},
];

export const CATEGORY_NAMES: Record<string, string> = Object.fromEntries(
  CATEGORIES.map((c) => [c.slug, c.fullName])
);

export const CATEGORY_NAME_KEYS: Record<string, string> = Object.fromEntries(
  CATEGORIES.map((c) => [c.slug, `catName.${c.slug}`])
);

export const CATEGORY_FULLNAME_KEYS: Record<string, string> = Object.fromEntries(
  CATEGORIES.map((c) => [c.slug, `catFull.${c.slug}`])
);
