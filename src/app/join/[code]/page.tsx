import React, { Suspense } from 'react';
import type { Metadata } from 'next';
import { JoinCodeClient } from './JoinCodeClient';

interface PageProps {
  params: Promise<{ code: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { code } = await params;
  const cleanCode = decodeURIComponent(code || '').trim().toUpperCase();

  return {
    title: `Únete a la fiesta (${cleanCode}) | PartyLot`,
    description: `Has sido invitado a una fiesta privada en PartyLot. Ingresa con el código de acceso ${cleanCode}.`,
    openGraph: {
      title: `Invitación a PartyLot · Código ${cleanCode}`,
      description: `Ingresa a la reunión privada en PartyLot en Monad Testnet.`,
      url: `https://partylot.vercel.app/join/${cleanCode}`,
      siteName: 'PartyLot',
    },
    twitter: {
      card: 'summary_large_image',
      title: `Invitación a PartyLot · Código ${cleanCode}`,
      description: `Ingresa a la reunión privada en PartyLot en Monad Testnet.`,
    },
  };
}

export default async function JoinCodePage({ params }: PageProps) {
  const { code } = await params;

  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#F7F2E8] dark:bg-[#12110E] flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-[#F0DC00] border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <JoinCodeClient code={code} />
    </Suspense>
  );
}
