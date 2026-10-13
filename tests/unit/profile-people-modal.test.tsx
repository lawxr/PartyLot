import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { ProfilePeopleModal } from '@/components/profile/ProfilePeopleModal';
import type { Member } from '@/types';

describe('ProfilePeopleModal', () => {
  const mockConnections: Member[] = [
    {
      id: 'u1',
      name: 'Sofia Reyes',
      handle: '@@sofia', // Corrupted handle with double @@
      avatar: '',       // Empty avatar string - must not trigger src="" error
      nightsTogether: 4,
    },
    {
      id: 'u2',
      name: 'Carlos Mendez',
      handle: 'carlos_m',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb',
      nightsTogether: 2,
    },
  ];

  it('renders nothing when closed', () => {
    const html = renderToStaticMarkup(
      <ProfilePeopleModal
        isOpen={false}
        onClose={vi.fn()}
        peopleConnections={mockConnections}
        onSelectMember={vi.fn()}
      />
    );
    expect(html).toBe('');
  });

  it('renders avatars without empty string src="" and normalizes handle to single @', () => {
    const html = renderToStaticMarkup(
      <ProfilePeopleModal
        isOpen={true}
        onClose={vi.fn()}
        peopleConnections={mockConnections}
        onSelectMember={vi.fn()}
      />
    );

    // Must NOT have empty string in src
    expect(html).not.toContain('src=""');

    // Must normalize handle to single @
    expect(html).toContain('@sofia');
    expect(html).not.toContain('@@sofia');

    // Must NOT render any Star icons
    expect(html).not.toContain('lucide-star');
    expect(html).not.toContain('Follow');

    // Must render names and nights together
    expect(html).toContain('Sofia Reyes');
    expect(html).toContain('Carlos Mendez');
  });
});
