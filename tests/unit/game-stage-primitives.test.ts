import { describe, it, expect } from 'vitest';
import * as StageComponents from '@/components/games/stage';

describe('Stage Components & Game Stage Primitives (Phase 0)', () => {
  it('exports all planned Stage components from barrel index', () => {
    expect(StageComponents.GameStage).toBeDefined();
    expect(StageComponents.GameEyebrow).toBeDefined();
    expect(StageComponents.FriendVoteCard).toBeDefined();
    expect(StageComponents.PickBlock).toBeDefined();
    expect(StageComponents.VoteBar).toBeDefined();
    expect(StageComponents.WinnerReveal).toBeDefined();
    expect(StageComponents.GameProgress).toBeDefined();
  });

  describe('Stage Component Type Signatures', () => {
    it('GameStage is a valid React functional component', () => {
      expect(typeof StageComponents.GameStage).toBe('function');
    });

    it('GameEyebrow is a valid React functional component', () => {
      expect(typeof StageComponents.GameEyebrow).toBe('function');
    });

    it('FriendVoteCard is a valid React functional component', () => {
      expect(typeof StageComponents.FriendVoteCard).toBe('function');
    });

    it('PickBlock is a valid React functional component', () => {
      expect(typeof StageComponents.PickBlock).toBe('function');
    });

    it('VoteBar is a valid React functional component', () => {
      expect(typeof StageComponents.VoteBar).toBe('function');
    });

    it('WinnerReveal is a valid React functional component', () => {
      expect(typeof StageComponents.WinnerReveal).toBe('function');
    });

    it('GameProgress is a valid React functional component', () => {
      expect(typeof StageComponents.GameProgress).toBe('function');
    });
  });
});
