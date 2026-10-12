'use client';

import React from 'react';
import { Calendar, KeyRound, Users, ChevronRight } from 'lucide-react';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { PressableCard } from '@/components/ui/PressableCard';
import { usePartyStore } from '@/store/usePartyStore';
import { useTranslation } from '@/lib/i18n/useTranslation';

interface CreateActionSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenCreateCrew?: () => void;
}

export const CreateActionSheet: React.FC<CreateActionSheetProps> = ({
  isOpen,
  onClose,
  onOpenCreateCrew,
}) => {
  const { setCurrentView } = usePartyStore();
  const { language } = useTranslation();
  const isEs = language === 'es';

  const handleSelect = (action: () => void) => {
    onClose();
    action();
  };

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title={isEs ? 'Crear o unirse' : 'Create or Join'}
    >
      <div className="space-y-3 pt-1 pb-4">
        {/* Option 1: Create Gathering / Party */}
        <PressableCard
          onClick={() => handleSelect(() => setCurrentView('create-party'))}
          className="p-4 rounded-2xl bg-black/[0.03] dark:bg-white/[0.04] border border-black/8 dark:border-white/10 hover:border-[#F0DC00] dark:hover:border-[#F0DC00] transition-colors flex items-center justify-between group"
          aria-label={isEs ? 'Organizar una fiesta' : 'Host a party'}
        >
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-11 h-11 rounded-2xl bg-[#F0DC00] text-[#171512] flex items-center justify-center shrink-0 shadow-sm">
              <Calendar className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div className="min-w-0">
              <h4 className="font-display font-bold text-sm sm:text-base text-[#171512] dark:text-white leading-tight">
                {isEs ? 'Organizar una fiesta' : 'Host a party'}
              </h4>
              <p className="text-xs text-[#6F6A62] dark:text-[#A8A196] font-medium mt-0.5 truncate">
                {isEs ? 'Elige fecha, lugar y comparte con tus amigos' : 'Choose date, venue and invite your crew'}
              </p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-[#8E887E] dark:text-[#A8A196] group-hover:translate-x-0.5 transition-transform shrink-0 ml-2" />
        </PressableCard>

        {/* Option 2: Join with Code */}
        <PressableCard
          onClick={() => handleSelect(() => setCurrentView('join-party'))}
          className="p-4 rounded-2xl bg-black/[0.03] dark:bg-white/[0.04] border border-black/8 dark:border-white/10 hover:border-[#F0DC00] dark:hover:border-[#F0DC00] transition-colors flex items-center justify-between group"
          aria-label={isEs ? 'Unirme con código' : 'Join with code'}
        >
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-11 h-11 rounded-2xl bg-white dark:bg-[#25221D] border border-black/10 dark:border-white/15 text-[#171512] dark:text-[#F0DC00] flex items-center justify-center shrink-0 shadow-xs">
              <KeyRound className="w-5 h-5 stroke-[2]" />
            </div>
            <div className="min-w-0">
              <h4 className="font-display font-bold text-sm sm:text-base text-[#171512] dark:text-white leading-tight">
                {isEs ? 'Unirme con código' : 'Join with code'}
              </h4>
              <p className="text-xs text-[#6F6A62] dark:text-[#A8A196] font-medium mt-0.5 truncate">
                {isEs ? 'Ingresa el código de 4 caracteres de tu anfitrión' : 'Enter the 4-character code from your host'}
              </p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-[#8E887E] dark:text-[#A8A196] group-hover:translate-x-0.5 transition-transform shrink-0 ml-2" />
        </PressableCard>

        {/* Option 3: Create Crew */}
        {onOpenCreateCrew && (
          <PressableCard
            onClick={() => handleSelect(onOpenCreateCrew)}
            className="p-4 rounded-2xl bg-black/[0.03] dark:bg-white/[0.04] border border-black/8 dark:border-white/10 hover:border-[#F0DC00] dark:hover:border-[#F0DC00] transition-colors flex items-center justify-between group"
            aria-label={isEs ? 'Crear un crew' : 'Create a crew'}
          >
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="w-11 h-11 rounded-2xl bg-white dark:bg-[#25221D] border border-black/10 dark:border-white/15 text-[#171512] dark:text-white flex items-center justify-center shrink-0 shadow-xs">
                <Users className="w-5 h-5 stroke-[2]" />
              </div>
              <div className="min-w-0">
                <h4 className="font-display font-bold text-sm sm:text-base text-[#171512] dark:text-white leading-tight">
                  {isEs ? 'Crear un crew' : 'Create a crew'}
                </h4>
                <p className="text-xs text-[#6F6A62] dark:text-[#A8A196] font-medium mt-0.5 truncate">
                  {isEs ? 'Crea un grupo de amigos para salir juntos' : 'Build your recurring group for nights out'}
                </p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-[#8E887E] dark:text-[#A8A196] group-hover:translate-x-0.5 transition-transform shrink-0 ml-2" />
          </PressableCard>
        )}
      </div>
    </BottomSheet>
  );
};
