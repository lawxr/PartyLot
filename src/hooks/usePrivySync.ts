'use client';

import { useEffect, useRef, useCallback } from 'react';
import { usePrivy, useWallets } from '@privy-io/react-auth';
import { usePartyStore } from '@/store/usePartyStore';
import { fetchUserProfileFromDb } from '@/services/supabaseService';

/**
 * Custom hook to reactively synchronize Privy authenticated identity
 * and embedded wallet state into the Partylot central store.
 */
export function usePrivySync() {
  const { ready, authenticated, user, logout: privyLogout, login: privyLogin } = usePrivy();
  const { wallets } = useWallets();

  // Track the last synchronized identity signature to prevent duplicate sync cycles
  const lastSyncedKeyRef = useRef<string>('');

  // Primary wallet address
  const embeddedWallet = wallets.find((w) => w.walletClientType === 'privy') || wallets[0];
  const walletAddress = embeddedWallet?.address || user?.wallet?.address;

  useEffect(() => {
    if (!ready) return;

    if (!authenticated || !user) {
      lastSyncedKeyRef.current = '';
      return;
    }

    const syncKey = `${user.id}:${walletAddress || ''}`;
    if (lastSyncedKeyRef.current === syncKey) {
      return;
    }
    lastSyncedKeyRef.current = syncKey;

    let isSubscribed = true;

    const email =
      user.email?.address ||
      user.google?.email ||
      user.apple?.email ||
      (user.phone?.number ? `sms:${user.phone.number}` : undefined);

    const authMethod = user.google
      ? 'google'
      : user.apple
      ? 'apple'
      : user.email
      ? 'email'
      : user.phone
      ? 'phone'
      : 'social';

    const displayName =
      user.google?.name ||
      (email ? email.split('@')[0] : 'PartyMember');

    // Unique handle fallback: alphanumeric core + last 4 chars of user id
    const uniqueSuffix = user.id.replace(/[^a-zA-Z0-9]/g, '').slice(-4).toLowerCase();
    const defaultUniqueHandle = `@${displayName.toLowerCase().replace(/[^a-z0-9_]/g, '')}_${uniqueSuffix}`;

    const store = usePartyStore.getState();

    // Check if user has an existing persisted profile in Supabase
    void fetchUserProfileFromDb(user.id).then((persisted) => {
      if (!isSubscribed) return;

      void store.updateUser({
        id: user.id,
        name: persisted?.name || displayName,
        handle: persisted?.handle || defaultUniqueHandle,
        avatar: persisted?.avatar || undefined,
        email: email || undefined,
        walletAddress: walletAddress || undefined,
        authMethod,
        isPrivyAuthenticated: true,
      });
    });

    // Hydrate live data from Supabase for this session
    store.hydrateFromSupabase().catch((err) =>
      console.warn('Initial Supabase hydration fallback:', err)
    );

    // Automatically transition from splash to home upon authenticating
    if (store.currentView === 'splash') {
      store.setCurrentView('home');
    }

    return () => {
      isSubscribed = false;
    };
  }, [ready, authenticated, user, walletAddress]);

  const handleLogout = useCallback(async () => {
    try {
      await privyLogout();
    } catch (e) {
      console.warn('Privy logout error/ignored:', e);
    }
    usePartyStore.getState().resetUserSession();
    lastSyncedKeyRef.current = '';
  }, [privyLogout]);

  return {
    ready,
    authenticated,
    user,
    wallets,
    login: privyLogin,
    logout: handleLogout,
  };
}
