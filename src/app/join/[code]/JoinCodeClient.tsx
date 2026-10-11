'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { usePartyStore } from '@/store/usePartyStore';

export function JoinCodeClient({ code }: { code: string }) {
  const router = useRouter();
  const setPendingInviteCode = usePartyStore((s) => s.setPendingInviteCode);
  const setCurrentView = usePartyStore((s) => s.setCurrentView);
  const theme = usePartyStore((s) => s.theme);
  const [statusMessage, setStatusMessage] = useState('Verificando código de invitación...');

  useEffect(() => {
    let isMounted = true;

    async function handleInviteCode() {
      const raw = decodeURIComponent(code || '').trim();
      if (!raw) {
        setCurrentView('join-party');
        router.replace('/');
        return;
      }

      // Sanitize invite code (typically 4-8 alphanumeric chars)
      const sanitized = raw.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 10).toUpperCase();

      if (isMounted) {
        setStatusMessage(`Preparando fiesta (${sanitized})...`);
      }

      setPendingInviteCode(sanitized);
      setCurrentView('join-party');

      // Brief transition before landing in main app shell
      router.replace('/');
    }

    handleInviteCode();

    return () => {
      isMounted = false;
    };
  }, [code, router, setPendingInviteCode, setCurrentView]);

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
