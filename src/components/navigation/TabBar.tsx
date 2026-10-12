import React from 'react';
import { motion } from 'framer-motion';
import { Home, Users, Activity, User } from 'lucide-react';
import { usePartyStore, MainTab } from '@/store/usePartyStore';
import { useTranslation } from '@/lib/i18n/useTranslation';

export const TabBar: React.FC = () => {
  const { activeTab, setActiveTab, currentView, setCurrentView } = usePartyStore();
  const { language } = useTranslation();
  const isEs = language === 'es';

  // TabBar belongs to the dashboard/tabs views and profile view
  if (currentView !== 'home' && currentView !== 'profile') {
    return null;
  }

  const tabs: { id: MainTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'home', label: isEs ? 'Inicio' : 'Home', icon: Home },
    { id: 'crews', label: 'Crews', icon: Users },
    { id: 'activity', label: isEs ? 'Actividad' : 'Activity', icon: Activity },
    { id: 'profile', label: isEs ? 'Perfil' : 'Profile', icon: User },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 pointer-events-none flex justify-center px-4 pb-3 sm:pb-4 safe-bottom">
      <nav
        aria-label="Main Navigation"
        className="pointer-events-auto liquid-glass-nav rounded-[36px] px-2.5 sm:px-3 py-1.5 sm:py-2 flex items-center max-w-sm sm:max-w-md w-full justify-around"
      >
        <div role="tablist" aria-label="Main Sections" className="flex items-center w-full justify-around">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive =
              (currentView === 'home' && activeTab === tab.id) ||
              (currentView === 'profile' && tab.id === 'profile');

            return (
              <button
                key={tab.id}
                role="tab"
                aria-selected={isActive}
                aria-label={tab.label}
                tabIndex={0}
                onClick={() => {
                  if (currentView !== 'home') {
                    setCurrentView('home');
                  }
                  setActiveTab(tab.id);
                }}
                className="relative py-2 px-3.5 sm:px-4.5 rounded-[24px] flex flex-col items-center justify-center transition-transform active:scale-95 cursor-pointer focus-visible:outline-2 focus-visible:outline-[#F0DC00] focus-visible:outline-offset-2"
              >
                {isActive && (
                  <motion.div
                    layoutId="activeTabBadge"
                    className="absolute inset-0 rounded-[24px] bg-[#F0DC00] shadow-xs"
                    transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                  />
                )}
                <Icon
                  className={`relative z-10 w-5 h-5 transition-colors duration-200 ${
                    isActive ? 'text-[#171512] stroke-[2.2]' : 'text-[#6F6A62] dark:text-[#A8A196] hover:text-[#171512] dark:hover:text-white'
                  }`}
                />
                <span
                  className={`relative z-10 text-[10px] mt-0.5 tracking-tight font-semibold transition-colors ${
                    isActive ? 'text-[#171512] font-bold' : 'text-[#6F6A62] dark:text-[#A8A196]'
                  }`}
                >
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
};
