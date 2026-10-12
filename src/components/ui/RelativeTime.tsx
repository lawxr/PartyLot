'use client';

import React from 'react';
import { formatRelativeTime, formatShortRelativeTime, SupportedLocale } from '@/lib/time';
import { useTranslation } from '@/lib/i18n/useTranslation';

export interface RelativeTimeProps {
  date: string | number | Date | null | undefined;
  short?: boolean;
  className?: string;
}

export const RelativeTime: React.FC<RelativeTimeProps> = ({
  date,
  short = false,
  className = '',
}) => {
  const { language } = useTranslation();
  const locale: SupportedLocale = language === 'en' ? 'en' : 'es';

  const text = short
    ? formatShortRelativeTime(date, locale)
    : formatRelativeTime(date, locale);

  const iso = (() => {
    if (!date) return undefined;
    const d = date instanceof Date ? date : new Date(date);
    return isNaN(d.getTime()) ? undefined : d.toISOString();
  })();

  return (
    <time
      dateTime={iso}
      className={`text-xs text-[#6F6A62] dark:text-[#A39D92] ${className}`}
    >
      {text}
    </time>
  );
};
