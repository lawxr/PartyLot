'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Camera,
  ChevronRight,
  ShieldCheck,
  Check,
  Copy,
  Lock,
  Globe,
  Star,
  Eye,
  Bell,
  Moon,
  Sun,
  LogOut,
} from 'lucide-react';
import { usePartyStore } from '@/store/usePartyStore';
import { usePrivySync } from '@/hooks/usePrivySync';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { LanguageSwitch } from '@/components/ui/LanguageSwitch';

interface ProfileSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenEditProfile: () => void;
  activeAddress?: string;
  copied: boolean;
  onCopyAddress: () => void;
}

export const ProfileSettingsModal: React.FC<ProfileSettingsModalProps> = ({
  isOpen,
  onClose,
  onOpenEditProfile,
  activeAddress,
  copied,
  onCopyAddress,
}) => {
  const { currentUser, updateUser, theme, toggleTheme } = usePartyStore();
  const { logout: privyLogout } = usePrivySync();
  const { language } = useTranslation();
  const isEs = language === 'es';

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/45 backdrop-blur-[10px]"
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
            className="relative z-10 w-full max-w-md bg-[#FFFDF8] dark:bg-[#1C1A16] rounded-t-[36px] sm:rounded-[36px] p-6 text-[#171512] dark:text-[#F5F1E8] shadow-2xl border border-white/85 dark:border-white/15 safe-bottom max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-extrabold text-lg text-[#171512] dark:text-white">
                {isEs ? 'Configuración y Privacidad' : 'Settings & Privacy'}
              </h3>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-black/5 dark:bg-white/10 flex items-center justify-center text-[#171512] dark:text-white hover:bg-black/10 dark:hover:bg-white/15 cursor-pointer"
                aria-label="Cerrar ajustes"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Direct Edit Profile Button */}
            <button
              onClick={() => {
                onClose();
                onOpenEditProfile();
              }}
              className="w-full py-3 px-4 rounded-2xl bg-[#F0DC00]/15 border border-[#F0DC00]/40 text-[#171512] dark:text-[#F0DC00] font-bold text-xs flex items-center justify-between mb-4 cursor-pointer hover:bg-[#F0DC00]/25 transition-all"
            >
              <div className="flex items-center gap-2">
                <Camera className="w-4 h-4 text-[#F0DC00]" />
                <span>{isEs ? 'Editar perfil completo' : 'Edit Full Profile'}</span>
              </div>
              <ChevronRight className="w-4 h-4 text-[#F0DC00]" />
            </button>

            {/* Wallet Info */}
            {activeAddress && (
              <div className="p-3.5 rounded-2xl bg-white/70 dark:bg-white/5 border border-black/5 dark:border-white/10 mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <div>
                    <span className="text-[10px] font-bold text-[#8E887E] dark:text-[#A8A196] uppercase block">
                      Base Wallet
                    </span>
                    <span className="text-xs font-mono font-semibold text-[#171512] dark:text-white">
                      {activeAddress.slice(0, 6)}...{activeAddress.slice(-4)}
                    </span>
                  </div>
                </div>
                <button
                  onClick={onCopyAddress}
                  className="p-1.5 rounded-lg bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/15 text-[#171512] dark:text-white cursor-pointer"
                >
                  {copied ? (
                    <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
              </div>
            )}

            {/* Privacy & Social Controls */}
            <div className="pt-2 pb-1">
              <span className="text-[10px] uppercase font-mono tracking-widest text-[#8E887E] dark:text-[#A8A196] block mb-2">
                {isEs ? 'Privacidad y Red Social' : 'Privacy & Social'}
              </span>

              {/* Private Profile Toggle */}
              <div className="flex items-center justify-between py-2.5 border-b border-black/5 dark:border-white/10">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-black/5 dark:bg-white/10 flex items-center justify-center text-[#171512] dark:text-[#F0DC00]">
                    {currentUser.isPrivate ? <Lock className="w-4 h-4" /> : <Globe className="w-4 h-4" />}
                  </div>
                  <div>
                    <span className="text-xs font-bold text-[#171512] dark:text-white block">
                      {isEs ? 'Cuenta privada' : 'Private account'}
                    </span>
                    <span className="text-[10px] text-[#8E887E] dark:text-[#A8A196]">
                      {currentUser.isPrivate
                        ? (isEs ? 'Solo miembros de tus Crews ven tu perfil' : 'Only crew members see your profile')
                        : (isEs ? 'Perfil público para toda la comunidad' : 'Public profile visible to community')}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => updateUser({ isPrivate: !currentUser.isPrivate })}
                  className={`w-12 h-7 rounded-full p-1 transition-colors duration-200 cursor-pointer flex items-center ${
                    currentUser.isPrivate ? 'bg-[#F0DC00] justify-end' : 'bg-black/15 dark:bg-white/20 justify-start'
                  }`}
                  aria-label="Toggle private profile"
                >
                  <motion.div
                    layout
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    className="w-5 h-5 rounded-full bg-white dark:bg-[#171512] shadow-sm"
                  />
                </button>
              </div>

              {/* Show Attended Nights Toggle */}
              <div className="flex items-center justify-between py-2.5 border-b border-black/5 dark:border-white/10">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-black/5 dark:bg-white/10 flex items-center justify-center text-[#171512] dark:text-[#F0DC00]">
                    <Eye className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-[#171512] dark:text-white block">
                      {isEs ? 'Mostrar historial de noches' : 'Show attended nights history'}
                    </span>
                    <span className="text-[10px] text-[#8E887E] dark:text-[#A8A196]">
                      {currentUser.showNights !== false
                        ? (isEs ? 'Visible en tu perfil' : 'Visible on your profile')
                        : (isEs ? 'Oculto para los demás' : 'Hidden from others')}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => updateUser({ showNights: currentUser.showNights === false ? true : false })}
                  className={`w-12 h-7 rounded-full p-1 transition-colors duration-200 cursor-pointer flex items-center ${
                    currentUser.showNights !== false ? 'bg-[#F0DC00] justify-end' : 'bg-black/15 dark:bg-white/20 justify-start'
                  }`}
                  aria-label="Toggle show nights"
                >
                  <motion.div
                    layout
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    className="w-5 h-5 rounded-full bg-white dark:bg-[#171512] shadow-sm"
                  />
                </button>
              </div>

              {/* Allow Follows / Stars Toggle */}
              <div className="flex items-center justify-between py-2.5 border-b border-black/5 dark:border-white/10">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-black/5 dark:bg-white/10 flex items-center justify-center text-[#171512] dark:text-[#F0DC00]">
                    <Star className="w-4 h-4 fill-current stroke-[1.5]" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-[#171512] dark:text-white block">
                      {isEs ? 'Permitir que te sigan (estrella)' : 'Allow follows (stars)'}
                    </span>
                    <span className="text-[10px] text-[#8E887E] dark:text-[#A8A196]">
                      {currentUser.allowFollows !== false
                        ? (isEs ? 'Cualquiera puede seguirte' : 'Anyone can star/follow you')
                        : (isEs ? 'Seguimientos deshabilitados' : 'Follows disabled')}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => updateUser({ allowFollows: currentUser.allowFollows === false ? true : false })}
                  className={`w-12 h-7 rounded-full p-1 transition-colors duration-200 cursor-pointer flex items-center ${
                    currentUser.allowFollows !== false ? 'bg-[#F0DC00] justify-end' : 'bg-black/15 dark:bg-white/20 justify-start'
                  }`}
                  aria-label="Toggle allow follows"
                >
                  <motion.div
                    layout
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    className="w-5 h-5 rounded-full bg-white dark:bg-[#171512] shadow-sm"
                  />
                </button>
              </div>
            </div>

            {/* Notification Preferences */}
            <div className="pt-2 pb-1">
              <span className="text-[10px] uppercase font-mono tracking-widest text-[#8E887E] dark:text-[#A8A196] block mb-2">
                {isEs ? 'Notificaciones' : 'Notifications'}
              </span>

              <div className="flex items-center justify-between py-2.5 border-b border-black/5 dark:border-white/10">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-black/5 dark:bg-white/10 flex items-center justify-center text-[#171512] dark:text-[#F0DC00]">
                    <Bell className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-[#171512] dark:text-white block">
                      {isEs ? 'Invitaciones a fiestas' : 'Party invitations'}
                    </span>
                    <span className="text-[10px] text-[#8E887E] dark:text-[#A8A196]">
                      {currentUser.notifyInvites !== false
                        ? (isEs ? 'Alertas activas' : 'Active alerts')
                        : (isEs ? 'Silenciadas' : 'Muted')}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => updateUser({ notifyInvites: currentUser.notifyInvites === false ? true : false })}
                  className={`w-12 h-7 rounded-full p-1 transition-colors duration-200 cursor-pointer flex items-center ${
                    currentUser.notifyInvites !== false ? 'bg-[#F0DC00] justify-end' : 'bg-black/15 dark:bg-white/20 justify-start'
                  }`}
                  aria-label="Toggle invite notifications"
                >
                  <motion.div
                    layout
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    className="w-5 h-5 rounded-full bg-white dark:bg-[#171512] shadow-sm"
                  />
                </button>
              </div>
            </div>

            {/* App Preferences */}
            <div className="pt-2 pb-1">
              <span className="text-[10px] uppercase font-mono tracking-widest text-[#8E887E] dark:text-[#A8A196] block mb-2">
                {isEs ? 'Aplicación' : 'App Preferences'}
              </span>

              {/* Dark Mode Toggle */}
              <div className="flex items-center justify-between py-2.5 border-b border-black/5 dark:border-white/10">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-black/5 dark:bg-white/10 flex items-center justify-center text-[#171512] dark:text-[#F0DC00]">
                    {theme === 'dark' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
                  </div>
                  <div>
                    <span className="text-xs font-bold text-[#171512] dark:text-white block">
                      {isEs ? 'Modo oscuro' : 'Dark mode'}
                    </span>
                    <span className="text-[10px] text-[#8E887E] dark:text-[#A8A196]">
                      {theme === 'dark'
                        ? (isEs ? 'Activado' : 'Enabled')
                        : (isEs ? 'Desactivado (modo claro)' : 'Disabled (light mode)')}
                    </span>
                  </div>
                </div>
                <button
                  onClick={toggleTheme}
                  className={`w-12 h-7 rounded-full p-1 transition-colors duration-200 cursor-pointer flex items-center ${
                    theme === 'dark' ? 'bg-[#F0DC00] justify-end' : 'bg-black/15 dark:bg-white/20 justify-start'
                  }`}
                  aria-label="Toggle dark mode"
                >
                  <motion.div
                    layout
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    className="w-5 h-5 rounded-full bg-white dark:bg-[#171512] shadow-sm flex items-center justify-center"
                  >
                    {theme === 'dark' ? (
                      <Moon className="w-3 h-3 text-[#F0DC00]" />
                    ) : (
                      <Sun className="w-3 h-3 text-amber-500" />
                    )}
                  </motion.div>
                </button>
              </div>

              {/* Language Switch */}
              <div className="flex items-center justify-between py-2.5 border-b border-black/5 dark:border-white/10">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-black/5 dark:bg-white/10 flex items-center justify-center text-[#171512] dark:text-[#F0DC00]">
                    <Globe className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-[#171512] dark:text-white block">
                      {isEs ? 'Idioma' : 'Language'}
                    </span>
                    <span className="text-[10px] text-[#8E887E] dark:text-[#A8A196]">
                      {language === 'es' ? 'Español' : 'English'}
                    </span>
                  </div>
                </div>
                <LanguageSwitch compact />
              </div>

              {/* Account ID */}
              <div className="flex items-center justify-between py-2.5 border-b border-black/5 dark:border-white/10">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-black/5 dark:bg-white/10 flex items-center justify-center text-[#171512] dark:text-white">
                    <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-[#171512] dark:text-white block">
                      {isEs ? 'ID de cuenta' : 'Account ID'}
                    </span>
                    <span className="text-[10px] text-[#8E887E] dark:text-[#A8A196]">
                      {currentUser.id || 'usr_active'}
                    </span>
                  </div>
                </div>
                <button
                  onClick={onCopyAddress}
                  className="px-3 py-1.5 rounded-xl bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/15 text-xs font-bold text-[#171512] dark:text-white flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? (isEs ? 'Copiado' : 'Copied') : (isEs ? 'Copiar' : 'Copy')}</span>
                </button>
              </div>
            </div>

            {/* Logout Button */}
            <button
              onClick={() => {
                privyLogout();
                onClose();
              }}
              className="w-full mt-4 py-3 rounded-2xl bg-red-500/10 hover:bg-red-500/15 text-red-600 dark:text-red-400 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>{isEs ? 'Cerrar sesión' : 'Sign out'}</span>
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
