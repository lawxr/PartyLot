'use client';

import { useEffect, useCallback } from 'react';
import { usePrivy, useWallets } from '@privy-io/react-auth';
import { usePartyStore } from '@/store/usePartyStore';
import { fetchUserProfileFromDb } from '@/services/supabaseService';

// Global signature of the last synchronized identity to avoid duplicate sync cycles across component lifecycles
let globalSyncedKey = '';

/**
 * Custom hook to reactively synchronize Privy authenticated identity
 * and embedded wallet state into the Partylot central store.
 */
export function usePrivySync() {
  const { ready, authenticated, user, logout: privyLogout, login: privyLogin } = usePrivy();
  const { wallets } = useWallets();

  // Primary wallet address
  const embeddedWallet = wallets.find((w) => w.walletClientType === 'privy') || wallets[0];
  const walletAddress = embeddedWallet?.address || user?.wallet?.address;

  useEffect(() => {
    if (!ready) return;

    if (!authenticated || !user) {
      if (globalSyncedKey !== '') {
        globalSyncedKey = '';
        const store = usePartyStore.getState();
        if (store.currentUser.isPrivyAuthenticated) {
          store.resetUserSession();
        }
      }
      return;
    }

    const syncKey = `${user.id}:${walletAddress || ''}`;
    if (globalSyncedKey === syncKey) {
      return;
    }

    // Reset previous user's cached private data if switching authenticated accounts
    const initialStore = usePartyStore.getState();
    if (initialStore.currentUser.isPrivyAuthenticated && initialStore.currentUser.id !== user.id) {
      initialStore.resetUserSession();
    }

    globalSyncedKey = syncKey;

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

    // 1. Immediately apply authenticated state to store so downstream route gates
    // and UI components see an active authenticated session without waiting for network I/O
    void store.updateUser({
      id: user.id,
      name: displayName,
      handle: defaultUniqueHandle,
      email: email || undefined,
      walletAddress: walletAddress || undefined,
      authMethod,
      isPrivyAuthenticated: true,
    });

    // 2. Enrich profile from Supabase asynchronously if existing record is found
    void fetchUserProfileFromDb(user.id).then((persisted) => {
      if (!isSubscribed) return;
      if (persisted) {
        void store.updateUser({
          id: user.id,
          name: persisted.name || displayName,
          handle: persisted.handle || defaultUniqueHandle,
          avatar: persisted.avatar || undefined,
          email: email || undefined,
          walletAddress: walletAddress || undefined,
          authMethod,
          isPrivyAuthenticated: true,
        });
      }

      // Detect new users or accounts with default uncustomized profiles
      const storageKey = `partylot_onboarded_${user.id}`;
      const hasCompletedOnboardingLocal =
        typeof window !== 'undefined' && localStorage.getItem(storageKey) === 'true';

      const isDefaultOrPlaceholder =
        !persisted ||
        !persisted.name ||
        persisted.name === 'PartyMember' ||
        persisted.name === 'Guest' ||
        persisted.handle?.startsWith('@partymember');

      if (!hasCompletedOnboardingLocal && isDefaultOrPlaceholder) {
        store.setIsOnboardingOpen(true);
      }
    });

    // 3. Hydrate live data from Supabase for this session
    store.hydrateFromSupabase().catch((err) =>
      console.warn('Initial Supabase hydration fallback:', err)
    );

    return () => {
      isSubscribed = false;
    };
  }, [ready, authenticated, user, walletAddress]);

  const handleLogout = useCallback(async () => {
    globalSyncedKey = '';
    try {
      await privyLogout();
    } catch (e) {
      console.warn('Privy logout error/ignored:', e);
    }
    usePartyStore.getState().resetUserSession();
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
