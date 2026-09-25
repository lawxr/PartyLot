import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'PartyLot',
    short_name: 'PartyLot',
    description: 'Organiza fiestas, divide gastos, maneja tesorería onchain',
    start_url: '/',
    display: 'standalone',
    background_color: '#0A0D12',
    theme_color: '#836EF9',
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
    ],
  };
}
