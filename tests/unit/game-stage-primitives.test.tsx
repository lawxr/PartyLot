import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import {
  FriendVoteCard,
  PickBlock,
  WinnerReveal,
  VoteBar,
  GameProgress,
} from '@/components/games/stage';

describe('Game Stage Primitives Real Render Tests', () => {
  describe('FriendVoteCard', () => {
    const friend = { id: 'f1', name: 'Sofia', avatar: '' };

    it('renders unselected state with aria-pressed false', () => {
      const html = renderToStaticMarkup(
        <FriendVoteCard
          friend={friend}
          isSelected={false}
          onVote={() => {}}
        />
      );

      expect(html).toContain('aria-pressed="false"');
      expect(html).toContain('Sofia');
      expect(html).not.toContain('bg-party-yellow');
    });

    it('renders selected state with aria-pressed true and yellow accent classes', () => {
      const html = renderToStaticMarkup(
        <FriendVoteCard
          friend={friend}
          isSelected={true}
          onVote={() => {}}
        />
      );

      expect(html).toContain('aria-pressed="true"');
      expect(html).toContain('bg-party-yellow');
      expect(html).toContain('border-party-yellow');
    });
  });

  describe('PickBlock', () => {
    it('renders choice A without percentage before voting', () => {
      const html = renderToStaticMarkup(
        <PickBlock
          choice="A"
          title="Tacos"
          isChosen={false}
          isOtherChosen={false}
          onPick={() => {}}
        />
      );

      expect(html).toContain('Tacos');
      expect(html).not.toContain('%');
      expect(html).toContain('aria-pressed="false"');
    });

    it('renders choice B with percentage and vote tally after voting', () => {
      const html = renderToStaticMarkup(
        <PickBlock
          choice="B"
          title="Pizza"
          isChosen={true}
          isOtherChosen={false}
          percentage={75}
          votesCount={3}
          onPick={() => {}}
        />
      );

      expect(html).toContain('Pizza');
      expect(html).toContain('75%');
      expect(html).toContain('aria-pressed="true"');
    });
  });

  describe('WinnerReveal', () => {
    it('renders clear single winner celebration', () => {
      const winners = [{ id: 'f1', name: 'Mateo', avatar: '' }];
      const html = renderToStaticMarkup(
        <WinnerReveal
          winners={winners}
          votesCount={5}
          totalVotes={6}
          subtitle="Top pick"
        />
      );

      expect(html).toContain('Mateo');
      expect(html).toMatch(/EL GRUPO HA HABLADO|THE CREW HAS SPOKEN/);
    });

    it('renders tie outcome when multiple winners share top votes', () => {
      const winners = [
        { id: 'f1', name: 'Mateo', avatar: '' },
        { id: 'f2', name: 'Sofia', avatar: '' },
      ];
      const html = renderToStaticMarkup(
        <WinnerReveal
          winners={winners}
          votesCount={4}
          totalVotes={8}
          subtitle="Top pick"
        />
      );

      expect(html).toContain('Mateo &amp; Sofia');
      expect(html).toMatch(/EL GRUPO HA HABLADO|THE CREW HAS SPOKEN/);
    });
  });

  describe('VoteBar', () => {
    it('handles 0% safely without crash or NaN', () => {
      const friend = { id: 'f3', name: 'Valen', avatar: '' };
      const html = renderToStaticMarkup(
        <VoteBar
          friend={friend}
          votes={0}
          totalVotes={0}
          percentage={0}
          isWinner={false}
          index={0}
        />
      );

      expect(html).toContain('Valen');
      expect(html).toContain('0%');
      expect(html).not.toContain('NaN');
    });
  });

  describe('GameProgress', () => {
    it('renders accessible live progress status with hint', () => {
      const html = renderToStaticMarkup(
        <GameProgress
          votedCount={3}
          totalMembers={5}
          hintText="Tap to vote"
        />
      );

      expect(html).toContain('aria-live="polite"');
      expect(html).toContain('Tap to vote');
    });
  });
});
