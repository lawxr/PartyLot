import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { usePartyStore, detectInitialLanguage } from '@/store/usePartyStore';
import * as privySyncModule from '@/hooks/usePrivySync';
import * as supabaseService from '@/services/supabaseService';
import type { Party, User } from '@/types';

describe('SWR Cache-First Hydration and i18n Resilience', () => {
  const originalWindow = (globalThis as unknown as { window?: unknown }).window;

  const mockUser: User = {
    id: 'user-swr-1',
    name: 'SWR Tester',
    handle: '@swrtester',
    avatar: '',
    gatheringsCount: 0,
    gamesCount: 0,
    peopleCount: 0,
    settlementsCount: 0,
    balance: 0,
    isPrivyAuthenticated: true,
  };

  const mockParty: Party = {
    id: 'party-cached-1',
    code: 'CASH1',
    title: 'Cached Rooftop Gathering',
    description: 'A great party',
    date: 'Tonight',
    time: '9:00 PM',
    location: 'SoHo',
    coverImage: '',
    hostId: 'user-swr-1',
    hostName: 'SWR Tester',
    potBalance: 5,
    status: 'upcoming',
    createdAt: '2026-10-13T00:00:00.000Z',
    members: [],
  };

  beforeEach(() => {
    usePartyStore.setState({
      parties: [],
      isLoadingParties: false,
      currentUser: mockUser,
    });
    vi.restoreAllMocks();
  });

  afterEach(() => {
    if (originalWindow === undefined) {
      delete (globalThis as unknown as { window?: unknown }).window;
    } else {
      (globalThis as unknown as { window?: unknown }).window = originalWindow;
    }
  });

  describe('detectInitialLanguage', () => {
    it('synchronously reads saved language preference from localStorage without flash', () => {
      const mockStorage = {
        getItem: vi.fn().mockReturnValue(JSON.stringify({ state: { language: 'en' } })),
      };
      (globalThis as unknown as { window: unknown }).window = {
        localStorage: mockStorage,
        navigator: { languages: ['es-ES'], language: 'es-ES' },
      };

      const lang = detectInitialLanguage();
      expect(lang).toBe('en');
      expect(mockStorage.getItem).toHaveBeenCalledWith('partylot-storage-v1');
    });

    it('falls back to navigator language when localStorage is empty or unparsable', () => {
      const mockStorage = {
        getItem: vi.fn().mockReturnValue(null),
      };
      (globalThis as unknown as { window: unknown }).window = {
        localStorage: mockStorage,
        navigator: { languages: ['es-MX', 'en-US'], language: 'es-MX' },
      };

      const lang = detectInitialLanguage();
      expect(lang).toBe('es');
    });
  });

  describe('Stale-While-Revalidate hydrateFromSupabase', () => {
    it('preserves cached parties when Privy token is not yet ready (0ms flash prevention)', async () => {
      const cachedParties: Party[] = [mockParty];

      usePartyStore.setState({
        parties: cachedParties,
        isLoadingParties: false,
        currentUser: mockUser,
      });

      // Token is null (Privy still initializing iframe/crypto)
      vi.spyOn(privySyncModule, 'getClientPrivyToken').mockResolvedValue(null);
      const fetchPartiesSpy = vi.spyOn(supabaseService, 'fetchPartiesFromDb');

      await usePartyStore.getState().hydrateFromSupabase();

      // Crucial: The cached parties are NOT wiped out, and loading is not toggled
      expect(usePartyStore.getState().parties).toEqual(cachedParties);
      expect(usePartyStore.getState().isLoadingParties).toBe(false);
      expect(fetchPartiesSpy).not.toHaveBeenCalled();
    });

    it('revalidates in the background without setting isLoadingParties when cache is present', async () => {
      const cachedParties: Party[] = [mockParty];

      usePartyStore.setState({
        parties: cachedParties,
        isLoadingParties: false,
      });

      vi.spyOn(privySyncModule, 'getClientPrivyToken').mockResolvedValue('valid-auth-token');

      const updatedParties: Party[] = [
        {
          ...cachedParties[0],
          title: 'Updated Server Title',
        },
      ];
      vi.spyOn(supabaseService, 'fetchPartiesFromDb').mockResolvedValue(updatedParties);
      vi.spyOn(supabaseService, 'fetchCrewsFromDb').mockResolvedValue([]);
      vi.spyOn(supabaseService, 'fetchActivitiesFromDb').mockResolvedValue([]);

      await usePartyStore.getState().hydrateFromSupabase();

      // Updated silently in background
      expect(usePartyStore.getState().parties[0].title).toBe('Updated Server Title');
      expect(usePartyStore.getState().isLoadingParties).toBe(false);
    });

    it('sets isLoadingParties to true during fetch only when cache is cold (0 parties)', async () => {
      usePartyStore.setState({
        parties: [],
        isLoadingParties: false,
      });

      vi.spyOn(privySyncModule, 'getClientPrivyToken').mockResolvedValue('valid-auth-token');

      let capturedLoadingDuringFetch = false;
      vi.spyOn(supabaseService, 'fetchPartiesFromDb').mockImplementation(async () => {
        capturedLoadingDuringFetch = usePartyStore.getState().isLoadingParties;
        return [];
      });
      vi.spyOn(supabaseService, 'fetchCrewsFromDb').mockResolvedValue([]);
      vi.spyOn(supabaseService, 'fetchActivitiesFromDb').mockResolvedValue([]);

      await usePartyStore.getState().hydrateFromSupabase();

      expect(capturedLoadingDuringFetch).toBe(true);
      expect(usePartyStore.getState().isLoadingParties).toBe(false);
    });
  });
});
