import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'PartyLot',
    short_name: 'PartyLot',
    description: 'Organiza fiestas, divide gastos, maneja tesorería onchain',
    start_url: '/',
    display: 'standalone',
    // Brand espresso, matching the icon tile.
    background_color: '#15140F',
    theme_color: '#15140F',
    orientation: 'portrait',
    icons: [
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
      },
      {
        // Full-bleed tile with the mark inside the safe zone, so it survives OS masks.
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  };
}
