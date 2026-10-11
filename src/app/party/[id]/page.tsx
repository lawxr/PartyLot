'use client';

import React, { Suspense, use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { usePartyStore } from '@/store/usePartyStore';

interface PageProps {
  params: Promise<{ id: string }>;
}

export function PartyRouteHandler({ id }: { id: string }) {
  const router = useRouter();
  const parties = usePartyStore((s) => s.parties);
  const selectParty = usePartyStore((s) => s.selectParty);
  const setCurrentView = usePartyStore((s) => s.setCurrentView);
  const setPendingInviteCode = usePartyStore((s) => s.setPendingInviteCode);
  const loadPartyFromSupabase = usePartyStore((s) => s.loadPartyFromSupabase);
  const theme = usePartyStore((s) => s.theme);
  const [statusMessage, setStatusMessage] = useState('Localizando fiesta...');

  useEffect(() => {
    let active = true;

    async function resolveDeepLink() {
      const raw = decodeURIComponent(id || '').trim();
      if (!raw) {
        setCurrentView('home');
        router.replace('/');
        return;
      }

      // 1. If it looks like a 4-6 char alphanumeric invite code (no hyphens/UUID format)
      const isShortCode = /^[a-zA-Z0-9]{4,6}$/.test(raw);
      if (isShortCode) {
        const cleanCode = raw.slice(0, 4).toUpperCase();
        setPendingInviteCode(cleanCode);
        setCurrentView('join-party');
        router.replace('/');
        return;
      }

      // 2. Check if party is already loaded in local store state
      const existing = parties.find(
        (p) => p.id.toLowerCase() === raw.toLowerCase() || p.code?.toUpperCase() === raw.toUpperCase()
      );

      if (existing) {
        selectParty(existing.id);
        router.replace('/');
        return;
      }

      // 3. Attempt to fetch details from Supabase if not in local store
      setStatusMessage('Cargando detalles de la fiesta...');
      try {
        if (typeof loadPartyFromSupabase === 'function') {
          await loadPartyFromSupabase(raw);
        }
      } catch (err) {
        console.warn('Failed to load party from backend:', err);
      }

      if (!active) return;

      // Check once more after load attempt
      const afterLoad = usePartyStore
        .getState()
        .parties.find((p) => p.id.toLowerCase() === raw.toLowerCase());

      if (afterLoad) {
        selectParty(afterLoad.id);
      } else {
        // Fallback: select by ID directly so PartyDetailView can handle or fallback
        selectParty(raw);
      }

      router.replace('/');
    }

    resolveDeepLink();

    return () => {
      active = false;
    };
  }, [id, parties, selectParty, setCurrentView, setPendingInviteCode, loadPartyFromSupabase, router]);

  return (
    <div
      className={`min-h-screen flex items-center justify-center transition-colors duration-300 ${
        theme === 'dark' ? 'bg-[#12110E] text-[#F5F1E8]' : 'bg-[#F7F2E8] text-[#171512]'
      }`}
    >
      <div className="flex flex-col items-center gap-3">
        <div className="w-9 h-9 border-2 border-[#F0DC00] border-t-transparent rounded-full animate-spin" />
        <span className="text-xs font-mono uppercase tracking-widest text-[#6F6A62] dark:text-[#A8A29E]">
          {statusMessage}
        </span>
      </div>
    </div>
  );
}

export default function PartyDeepLinkPage({ params }: PageProps) {
  const { id } = use(params);

  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#F7F2E8] dark:bg-[#12110E] flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-[#F0DC00] border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <PartyRouteHandler id={id} />
    </Suspense>
  );
}
