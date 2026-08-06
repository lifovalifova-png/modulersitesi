/* ── İçerik renderer: \n\n paragraflar, ## başlık, - liste ─── */
// NOT: Saf (React import'suz — jsx: "react-jsx" otomatik runtime). Node-güvenli:
// yalnız string → JSX elementleri üretir, başka modül import etmez. Hem
// BlogDetayPage hem prerender script'i buradan import eder (tek kaynak).
export function renderIcerik(icerik: string) {
  const blocks = icerik.trim().split(/\n\n+/);
  return blocks.map((block, i) => {
    if (block.startsWith('## ')) {
      return (
        <h2 key={i} className="text-xl font-bold text-gray-800 mt-8 mb-3">
          {block.slice(3)}
        </h2>
      );
    }
    const lines = block.split('\n');
    const isUl  = lines.every((l) => l.startsWith('- '));
    if (isUl) {
      return (
        <ul key={i} className="list-disc list-inside space-y-1.5 text-gray-700 text-sm leading-relaxed">
          {lines.map((l) => <li key={l}>{l.slice(2)}</li>)}
        </ul>
      );
    }
    return (
      <p key={i} className="text-gray-700 text-sm leading-relaxed">
        {block}
      </p>
    );
  });
}
