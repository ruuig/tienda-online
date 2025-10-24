/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    appDir: true,
  },
  images: {
    domains: ['img.clerk.com', 'images.clerk.dev', 'res.cloudinary.com'],
  },
  // Configuración para manejar rutas estáticas
  async rewrites() {
    return [
      {
        source: '/favicon.ico',
        destination: '/favicon.ico',
      },
    ]
  },
  // Excluir rutas problemáticas de la compilación estática
  output: 'standalone',
  // Configuración para evitar errores durante la compilación
  onDemandEntries: {
    // Mantener las páginas en memoria por más tiempo
    maxInactiveAge: 25 * 1000,
    pagesBufferLength: 2,
  },
}

module.exports = nextConfig
