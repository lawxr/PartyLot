'use client';

import { useEffect } from 'react';
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
  const { updateUser, resetUserSession, currentView, setCurrentView, hydrateFromSupabase } = usePartyStore();

  useEffect(() => {
    if (!ready) return;

    if (authenticated && user) {
      let isSubscribed = true;

      // Find the Privy embedded EVM wallet
      const embeddedWallet = wallets.find((w) => w.walletClientType === 'privy') || wallets[0];
      const address = embeddedWallet?.address || user.wallet?.address;

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

      // Check if user has an existing persisted profile in Supabase
      void fetchUserProfileFromDb(user.id).then((persisted) => {
        if (!isSubscribed) return;

        updateUser({
          id: user.id,
          name: persisted?.name || displayName,
          handle: persisted?.handle || defaultUniqueHandle,
          avatar: persisted?.avatar || undefined,
          email: email || undefined,
          walletAddress: address,
          authMethod,
          isPrivyAuthenticated: true,
        });
      });

      // Hydrate live data from Supabase for this session
      hydrateFromSupabase().catch((err) =>
        console.warn('Initial Supabase hydration fallback:', err)
      );

      // Automatically transition from splash to home upon authenticating
      if (currentView === 'splash') {
        setCurrentView('home');
      }

      return () => {
        isSubscribed = false;
      };
    }
  }, [ready, authenticated, user, wallets, updateUser, currentView, setCurrentView, hydrateFromSupabase]);

  const handleLogout = async () => {
    try {
      await privyLogout();
    } catch (e) {
      console.warn('Privy logout error/ignored:', e);
    }
    resetUserSession();
  };

  return {
    ready,
    authenticated,
    user,
    wallets,
    login: privyLogin,
    logout: handleLogout,
  };
}
