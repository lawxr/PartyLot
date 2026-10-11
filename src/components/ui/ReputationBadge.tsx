'use client';

import React from 'react';
import { Sparkles, Shield, Award, Crown, User, Info } from 'lucide-react';
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

    switch (rep.tier) {
      case 'og_legend':
        return <Crown {...iconProps} className={`${iconProps.className} text-[#F0DC00]`} />;
      case 'inner_circle':
        return <Award {...iconProps} className={`${iconProps.className} text-[#836EF9]`} />;
      case 'regular':
        return <Shield {...iconProps} className={`${iconProps.className} text-blue-500`} />;
      case 'initiate':
        return <Sparkles {...iconProps} className={`${iconProps.className} text-emerald-500`} />;
      default:
        return <User {...iconProps} className={`${iconProps.className} text-stone-500`} />;
    }
  };

  const sizeClasses = {
    xs: 'py-0.5 px-1.5 text-[10px] gap-1',
    sm: 'py-1 px-2.5 text-xs gap-1.5',
    md: 'py-1.5 px-3 text-xs gap-2',
  }[size];

  const label = isEs ? rep.tierNameEs : rep.tierName;

  return (
    <span
      className={`inline-flex items-center font-bold font-display rounded-full border transition-all ${rep.badgeBg} ${rep.badgeBorder} ${rep.badgeText} ${sizeClasses} ${className}`}
      title={`${label} (${rep.effectiveNights} ${isEs ? 'noches compartidas' : 'nights together'})`}
    >
      {getIcon()}
      {!showIconOnly && <span className="tracking-tight">{label}</span>}
    </span>
  );
};
