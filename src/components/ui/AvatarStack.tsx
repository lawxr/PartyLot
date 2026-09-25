'use client';

import React from 'react';
import { Member } from '@/types';

interface AvatarStackProps {
  members: Member[];
  maxDisplay?: number;
  size?: 'sm' | 'md' | 'lg';
  showCount?: boolean;
  countLabel?: string;
  className?: string;
  onMemberClick?: (member: Member) => void;
  variant?: 'light' | 'over-image';
}

export const AvatarStack: React.FC<AvatarStackProps> = ({
  members,
  maxDisplay = 4,
  size = 'md',
  showCount = true,
  countLabel = 'going',
  className = '',
  onMemberClick,
  variant = 'light',
}) => {
  const sizeMap = {
    sm: 'w-6 h-6 -space-x-1.5 text-[10px]',
    md: 'w-8 h-8 -space-x-2 text-xs',
    lg: 'w-10 h-10 -space-x-2.5 text-sm',
  }[size];

  const avatarSize = {
    sm: 'w-6 h-6 border-[1.5px]',
    md: 'w-8 h-8 border-2',
    lg: 'w-10 h-10 border-2',
  }[size];

  const visibleMembers = members.slice(0, maxDisplay);
  const remaining = Math.max(0, members.length - maxDisplay);
  const isOverImage = variant === 'over-image';

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className={`flex items-center ${sizeMap}`}>
        {visibleMembers.map((member, index) => (
          <div
            key={member.id || index}
            onClick={() => onMemberClick?.(member)}
            className={`relative rounded-full overflow-hidden shrink-0 shadow-sm ${avatarSize} ${
              isOverImage
                ? 'border-white bg-[#171512]'
                : 'border-[#FFFDF8] bg-[#F1EADF]'
            } ${
              onMemberClick ? 'cursor-pointer hover:scale-110 hover:z-20 transition-transform' : ''
            }`}
            style={{ zIndex: maxDisplay - index }}
            title={member.name}
          >
            {member.avatar ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={member.avatar}
                alt={member.name}
                className="w-full h-full object-cover"
                loading="lazy"
                decoding="async"
              />
            ) : (
              <div className="w-full h-full bg-[#F0DC00]/30 text-[#171512] flex items-center justify-center font-bold text-[10px]">
                {member.name ? member.name.charAt(0).toUpperCase() : 'M'}
              </div>
            )}
          </div>
        ))}

        {remaining > 0 && (
          <div
            className={`relative rounded-full overflow-hidden font-bold flex items-center justify-center shrink-0 shadow-sm ${avatarSize} ${
              isOverImage
                ? 'border-white glass-light text-white'
                : 'border-[#FFFDF8] bg-[#EFE9DF] text-[#171512]'
            }`}
            style={{ zIndex: 0 }}
          >
            +{remaining}
          </div>
        )}
      </div>

      {showCount && (
        <span
          className={`text-xs font-semibold tracking-tight ${
            isOverImage ? 'text-white drop-shadow' : 'text-[#6F6A62]'
          }`}
        >
          {members.length} {countLabel}
        </span>
      )}
    </div>
  );
};
