'use client';

import React from 'react';
import { Moon, Users, User } from 'lucide-react';
import { calculateReputation } from '@/lib/reputation';
import { useTranslation } from '@/lib/i18n/useTranslation';

interface ReputationBadgeProps {
  sharedNights?: number;
  gatheringsCount?: number;
  size?: 'xs' | 'sm' | 'md';
  showIconOnly?: boolean;
  className?: string;
}

export const ReputationBadge: React.FC<ReputationBadgeProps> = ({
  sharedNights = 0,
  gatheringsCount = 0,
  size = 'sm',
  showIconOnly = false,
  className = '',
}) => {
  const { language } = useTranslation();
  const isEs = language === 'es';

  const rep = calculateReputation(sharedNights, gatheringsCount);

  const getIcon = () => {
    const iconProps = {
      className: size === 'xs' ? 'w-3 h-3' : size === 'md' ? 'w-4 h-4' : 'w-3.5 h-3.5',
    };

    if (rep.effectiveNights <= 0) {
      return <User {...iconProps} className={`${iconProps.className} opacity-60`} />;
    }
    if (rep.effectiveNights === 1) {
      return <Moon {...iconProps} className={`${iconProps.className} text-[#171512] dark:text-[#F0DC00]`} />;
    }
    return <Users {...iconProps} className={`${iconProps.className} text-[#171512] dark:text-[#F0DC00]`} />;
  };

  const sizeClasses = {
    xs: 'py-0.5 px-1.5 text-[10px] gap-1',
    sm: 'py-1 px-2.5 text-xs gap-1.5',
    md: 'py-1.5 px-3 text-xs gap-2',
  }[size];

  const label =
    rep.effectiveNights > 0
      ? `${rep.effectiveNights} ${isEs ? (rep.effectiveNights === 1 ? 'noche juntos' : 'noches juntos') : (rep.effectiveNights === 1 ? 'night together' : 'nights together')}`
      : isEs
        ? 'Nuevo'
        : 'New';

  return (
    <span
      className={`inline-flex items-center font-medium font-ui rounded-full border transition-all ${rep.badgeBg} ${rep.badgeBorder} ${rep.badgeText} ${sizeClasses} ${className}`}
      title={`${rep.effectiveNights} ${isEs ? 'noches compartidas' : 'nights together'}`}
    >
      {getIcon()}
      {!showIconOnly && <span className="tracking-tight">{label}</span>}
    </span>
  );
};
