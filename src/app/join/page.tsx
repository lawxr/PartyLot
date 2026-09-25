'use client';

import React, { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { usePartyStore } from '@/store/usePartyStore';

function JoinRedirectHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const setPendingInviteCode = usePartyStore((s) => s.setPendingInviteCode);
  const setCurrentView = usePartyStore((s) => s.setCurrentView);

  useEffect(() => {
    const rawCode = searchParams.get('code') || searchParams.get('join');
    if (rawCode) {
      const cleanCode = rawCode.trim().slice(0, 4).toUpperCase();
      setPendingInviteCode(cleanCode);
      setCurrentView('join-party');
    } else {
      setCurrentView('join-party');
    }
    router.replace('/');
  }, [searchParams, router, setPendingInviteCode, setCurrentView]);

  return (
    <div className="min-h-screen bg-[#F7F2E8] flex items-center justify-center text-[#171512]">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-[#F0DC00] border-t-transparent rounded-full animate-spin" />
        <span className="text-xs font-mono uppercase tracking-widest text-[#6F6A62]">
          Entrando a la fiesta...
        </span>
      </div>
    </div>
  );
}

export default function JoinPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#F7F2E8] flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-[#F0DC00] border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <JoinRedirectHandler />
    </Suspense>
  );
}
