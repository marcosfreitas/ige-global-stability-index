import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/shared/i18n/request.ts');

const nextConfig: NextConfig = {
  reactCompiler: true,
  // Both load files that cannot survive bundling: sharp ships native binaries,
  // and satori resolves harfbuzzjs's hb.wasm relative to its own package. Left
  // to the bundler, satori's text shaping fails at runtime with an ENOENT on
  // hb.wasm — which only shows up once a render is attempted.
  serverExternalPackages: ['sharp', 'satori'],
};

export default withNextIntl(nextConfig);
