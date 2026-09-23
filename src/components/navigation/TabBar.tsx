'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Home, Users, Bell, User } from 'lucide-react';
import { usePartyStore, MainTab } from '@/store/usePartyStore';

export const TabBar: React.FC = () => {
  const { activeTab, setActiveTab, currentView } = usePartyStore();

  // TabBar belongs strictly to the root dashboard/tabs view
  if (currentView !== 'home') {
    return null;
  }

  const tabs: { id: MainTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'crews', label: 'Crews', icon: Users },
    { id: 'activity', label: 'Activity', icon: Bell },
    { id: 'profile', label: 'Profile', icon: User },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 pointer-events-none flex justify-center px-4 pb-4 safe-bottom">
      <nav
        aria-label="Main Navigation"
        className="pointer-events-auto liquid-glass-nav rounded-full px-3 sm:px-6 py-2 sm:py-2.5 flex items-center gap-1 sm:gap-4 shadow-2xl border border-white/15 max-w-sm sm:max-w-md md:max-w-lg w-full justify-around backdrop-blur-2xl"
      >
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id && currentView === 'home';

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="relative py-2 px-3 sm:px-4 rounded-full flex flex-col items-center justify-center transition-transform active:scale-90"
            >
              {isActive && (
                <motion.div
                  layoutId="activeTabBadge"
                  className="absolute inset-0 bg-white/15 rounded-full border border-white/20 shadow-inner"
                  transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                />
              )}
              <Icon
                className={`relative z-10 w-5 h-5 transition-colors duration-200 ${
                  isActive ? 'text-[#E9FF32]' : 'text-white/60 hover:text-white/90'
                }`}
              />
              <span
                className={`relative z-10 text-[10px] mt-0.5 tracking-tight font-medium transition-colors ${
                  isActive ? 'text-white font-bold' : 'text-white/50'
                }`}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </nav>
    </div>
  );
};
