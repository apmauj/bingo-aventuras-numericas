import type { NextConfig } from "next";

const isExport = process.env.NEXT_EXPORT === '1';

const nextConfig: NextConfig = {
  // GitHub Pages necesita static export; en dev usamos standalone
  output: isExport ? "export" : "standalone",

  // Para GitHub Pages: el sitio se sirve desde /bingo-aventuras-numericas/
  // En dev (localhost) no hace falta basePath
  basePath: isExport ? '/bingo-aventuras-numericas' : '',

  // Static export no soporta optimización de imágenes (requiere servidor)
  images: {
    unoptimized: true,
  },

  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
};

export default nextConfig;
