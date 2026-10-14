import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { GameWaitingLobby } from '@/components/games/stage/GameWaitingLobby';
import { GamesView } from '@/components/views/GamesView';
import { usePartyStore } from '@/store/usePartyStore';
import type { Party, Member } from '@/types';

describe('Game Waiting Lobby & Real-time Gating (DESIGN.md)', () => {
  const hostMember: Member = {
    id: 'user-host',
    name: 'Alex Host',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb',
    walletAddress: '0x1111111111111111111111111111111111111111',
  };

  const friendMember: Member = {
    id: 'user-friend',
    name: 'Sam Guest',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d',
    walletAddress: '0x2222222222222222222222222222222222222222',
  };

  const soloParty: Party = {
    id: 'party-solo',
    code: 'SOLO77',
    title: 'Solo Room',
    date: '2026-10-15',
    time: '20:00',
    location: 'Lounge',
    description: 'Waiting for friends',
    coverImage: '',
    hostId: hostMember.id,
    hostName: hostMember.name,
    members: [hostMember],
    potBalance: 0,
    createdAt: new Date().toISOString(),
    status: 'upcoming',
  };

  const duoParty: Party = {
    ...soloParty,
    id: 'party-duo',
    code: 'DUO88',
    members: [hostMember, friendMember],
  };

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('GameWaitingLobby component', () => {
    it('renders connected player and dashed waiting slot for missing friend', () => {
      const html = renderToStaticMarkup(
        <GameWaitingLobby party={soloParty} />
      );

      // Party code badge rendered
      expect(html).toContain('SOLO77');

      // Connected host member rendered
      expect(html).toContain('Alex Host');

      // Pending friend slot rendered with dashed border style
      expect(html).toContain('border-dashed');

      // Player counter rendered with minPlayersRequired translation
      expect(html).toContain('1 de 2 jugadores necesarios');

      // Share / invite CTA rendered
      expect(html).toContain('Copiar código para invitar');
    });
  });

  describe('GamesView gating integration', () => {
    it('renders GameWaitingLobby and locks game switcher tabs when only 1 member is present', () => {
      usePartyStore.setState({
        parties: [soloParty],
        currentPartyId: soloParty.id,
        activeGameId: 'whos-most-likely',
      });

      const html = renderToStaticMarkup(<GamesView />);

      // Should render the waiting lobby with party code
      expect(html).toContain('SOLO77');
      expect(html).toContain('1 de 2 jugadores necesarios');

      // Game switcher buttons should have cursor-not-allowed locked styling
      expect(html).toContain('cursor-not-allowed');
      expect(html).toContain('opacity-70');
    });

    it('unlocks games and does not render waiting lobby when 2 or more members are present', () => {
      usePartyStore.setState({
        parties: [duoParty],
        currentPartyId: duoParty.id,
        activeGameId: 'whos-most-likely',
      });

      const html = renderToStaticMarkup(<GamesView />);

      // Should NOT render the lobby code badge
      expect(html).not.toContain('DUO88');

      // Game switcher buttons should NOT be locked
      expect(html).not.toContain('cursor-not-allowed');
      expect(html).toContain('opacity-100');
    });
  });
});
