/**
 * pnpm hook: react-helmet-async'in virtual store'una @types/react ekler.
 * Bu olmadan TypeScript, HelmetProvider/Helmet class'larını farklı bir
 * React.Component instance olarak görüp TS2786 hatası verir.
 */
function readPackage(pkg) {
  if (pkg.name === 'react-helmet-async') {
    pkg.peerDependencies = {
      ...pkg.peerDependencies,
      '@types/react': '*',
    };
  }
  return pkg;
}

module.exports = { hooks: { readPackage } };
