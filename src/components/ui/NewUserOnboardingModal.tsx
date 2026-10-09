'use client';

import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Camera, Check, AlertCircle, ArrowRight, User } from 'lucide-react';
import { usePartyStore } from '@/store/usePartyStore';
import { usePrivy } from '@privy-io/react-auth';
import { useTranslation } from '@/lib/i18n/useTranslation';
import confetti from 'canvas-confetti';
import { uploadImageFile } from '@/services/storageService';
import { User as UserType } from '@/types';
import { AvatarCropModal } from '@/components/ui/AvatarCropModal';

interface OnboardingFormProps {
  currentUser: UserType;
  onClose: () => void;
}

const OnboardingForm: React.FC<OnboardingFormProps> = ({ currentUser, onClose }) => {
  const { updateUser } = usePartyStore();
  const { authenticated, getAccessToken } = usePrivy();
  const { t } = useTranslation();

  const initialName =
    currentUser.name && currentUser.name !== 'PartyMember' && currentUser.name !== 'Guest'
      ? currentUser.name
      : '';
  const initialHandle =
    currentUser.handle && !currentUser.handle.startsWith('@partymember') && currentUser.handle !== '@guest'
      ? currentUser.handle.replace(/^@/, '')
      : '';

  const [name, setName] = useState(initialName);
  const [handle, setHandle] = useState(initialHandle);
  const [handleManuallyEdited, setHandleManuallyEdited] = useState(Boolean(initialHandle));
  const [avatar, setAvatar] = useState(currentUser.avatar || '');
  const [isUploading, setIsUploading] = useState(false);
  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);
  const [isCropOpen, setIsCropOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newName = e.target.value;
    setName(newName);

    if (!handleManuallyEdited) {
      const suggested = newName
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9_]/g, '')
        .slice(0, 20);
      setHandle(suggested);
    }
  };

  const handleHandleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setHandleManuallyEdited(true);
    const cleaned = e.target.value.toLowerCase().replace(/^@/, '').replace(/[^a-z0-9_]/g, '');
    setHandle(cleaned);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const previewUrl = URL.createObjectURL(file);
    setCropImageSrc(previewUrl);
    setIsCropOpen(true);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleCropComplete = async (croppedBlob: Blob) => {
    setIsUploading(true);
    setError(null);
    try {
      const uploadedUrl = await uploadImageFile(croppedBlob, 'avatars');
      setAvatar(uploadedUrl);
    } catch (uploadErr) {
      console.error('Avatar upload failed in onboarding:', uploadErr);
      setError(uploadErr instanceof Error ? uploadErr.message : 'Error al subir la imagen.');
    } finally {
      setIsUploading(false);
      setCropImageSrc(null);
    }
  };

  const cleanHandle = handle.trim().replace(/^@/, '').toLowerCase();
  const isHandleValid = cleanHandle.length >= 3 && cleanHandle.length <= 24 && /^[a-z0-9_]+$/.test(cleanHandle);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      setError(t.onboarding.errorNameRequired);
      return;
    }

    if (!isHandleValid) {
      setError(t.onboarding.errorHandleInvalid);
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const formattedHandle = `@${cleanHandle}`;

    try {
      let token: string | null = null;
      if (authenticated) {
        try {
          token = await getAccessToken();
        } catch (tokenErr) {
          console.warn('Could not retrieve Privy token in onboarding:', tokenErr);
        }
      }

      await updateUser(
        {
          name: name.trim(),
          handle: formattedHandle,
          avatar: avatar.trim() || undefined,
        },
        token
      );

      if (typeof window !== 'undefined' && currentUser.id) {
        localStorage.setItem(`partylot_onboarded_${currentUser.id}`, 'true');
      }

      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#F0DC00', '#FFFFFF', '#FF3B30'],
      });

      onClose();
    } catch (err: unknown) {
      console.error('Onboarding save error:', err);
      setError(err instanceof Error ? err.message : 'No se pudo guardar tu perfil. Intenta de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={handleFileUpload}
      />

      {/* Avatar Upload / Selection */}
      <div className="flex flex-col items-center">
        <div className="relative group">
          <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden border-2 border-[#D8C700] dark:border-[#F0DC00] p-1 bg-white dark:bg-[#24211D] shadow-xl flex items-center justify-center">
            {isUploading ? (
              <div className="w-full h-full rounded-full bg-black/80 flex flex-col items-center justify-center gap-1 text-[#F0DC00]">
                <div className="w-5 h-5 border-2 border-[#F0DC00] border-t-transparent rounded-full animate-spin" />
                <span className="text-[9px] font-mono uppercase tracking-widest text-white/90">Subiendo</span>
              </div>
            ) : avatar ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img src={avatar} alt="Avatar" className="w-full h-full object-cover rounded-full" />
            ) : (
              <div className="w-full h-full rounded-full bg-[#F0DC00]/20 text-[#171512] dark:text-[#F0DC00] flex items-center justify-center font-display font-black text-3xl">
                {name ? name.charAt(0).toUpperCase() : <User className="w-8 h-8 text-[#171512]/60 dark:text-[#F0DC00]/80" />}
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="absolute bottom-0 right-0 p-2.5 rounded-full bg-[#F0DC00] hover:bg-[#E6D300] text-[#171512] border-2 border-[#FFFDF8] dark:border-[#1C1A16] shadow-md hover:scale-110 active:scale-95 transition-transform cursor-pointer disabled:opacity-50"
            title="Subir foto desde tu dispositivo o cámara"
          >
            <Camera className="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="mt-3 px-3.5 py-1.5 rounded-full bg-black/[0.04] dark:bg-white/10 border border-black/10 dark:border-white/15 text-xs font-bold text-[#171512] dark:text-white hover:bg-black/[0.08] dark:hover:bg-white/20 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
        >
          <Camera className="w-3.5 h-3.5 text-[#786300] dark:text-[#F0DC00]" />
          <span>{isUploading ? 'Subiendo...' : t.onboarding.uploadPhoto}</span>
        </button>

      </div>

      {/* Error Message */}
      {error && (
        <div className="flex items-center gap-2 p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-700 dark:text-rose-300 font-medium">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      {/* Name Input */}
      <div>
        <label className="block text-xs font-bold text-[#57524A] dark:text-[#A8A196] uppercase tracking-wider mb-2">
          {t.onboarding.nameLabel} <span className="text-[#A38200] dark:text-[#F0DC00]">*</span>
        </label>
        <input
          type="text"
          required
          autoFocus
          placeholder={t.onboarding.namePlaceholder}
          value={name}
          onChange={handleNameChange}
          className="w-full px-4 py-3.5 rounded-2xl bg-white dark:bg-[#24211D] text-[#171512] dark:text-[#F5F1E8] placeholder-[#767066] dark:placeholder-white/40 text-base font-semibold outline-none border border-black/15 dark:border-white/15 focus:border-[#F0DC00] focus:ring-2 focus:ring-[#F0DC00]/30 transition-all shadow-sm"
        />
      </div>

      {/* Handle / Username Input */}
      <div>
        <label className="block text-xs font-bold text-[#57524A] dark:text-[#A8A196] uppercase tracking-wider mb-2 flex items-center justify-between">
          <span>{t.onboarding.usernameLabel} <span className="text-[#A38200] dark:text-[#F0DC00]">*</span></span>
          <span className="text-[11px] font-mono text-[#706B62] dark:text-white/50 font-medium">3-24 letras, núm o _</span>
        </label>
        <div className="relative flex items-center">
          <span className="absolute left-4 font-mono font-bold text-[#786300] dark:text-[#F0DC00] text-base select-none pointer-events-none">
            @
          </span>
          <input
            type="text"
            required
            placeholder={t.onboarding.usernamePlaceholder}
            value={handle}
            onChange={handleHandleChange}
            className="w-full pl-8 pr-10 py-3.5 rounded-2xl bg-white dark:bg-[#24211D] text-[#171512] dark:text-[#F5F1E8] placeholder-[#767066] dark:placeholder-white/40 text-base font-mono font-semibold outline-none border border-black/15 dark:border-white/15 focus:border-[#F0DC00] focus:ring-2 focus:ring-[#F0DC00]/30 transition-all shadow-sm"
          />
          {isHandleValid && (
            <div className="absolute right-3.5 text-emerald-600 dark:text-emerald-400">
              <Check className="w-4 h-4 stroke-[2.5]" />
            </div>
          )}
        </div>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isSubmitting || !name.trim() || !isHandleValid}
        className="w-full py-4 rounded-2xl bg-[#F0DC00] hover:bg-[#E6D300] text-[#171512] font-display font-black text-base uppercase tracking-wider active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer shadow-[0_4px_20px_rgba(240,220,0,0.35)] disabled:bg-[#171512]/10 dark:disabled:bg-white/10 disabled:text-[#171512]/40 dark:disabled:text-white/30 disabled:cursor-not-allowed disabled:shadow-none mt-6"
      >
        {isSubmitting ? (
          <>
            <div className="w-4 h-4 border-2 border-[#171512] border-t-transparent rounded-full animate-spin" />
            <span>{t.onboarding.saving}</span>
          </>
        ) : (
          <>
            <span>{t.onboarding.submitButton}</span>
            <ArrowRight className="w-4 h-4 stroke-[2.5]" />
          </>
        )}
      </button>

      <AvatarCropModal
        isOpen={isCropOpen}
        imageSrc={cropImageSrc}
        onCropComplete={handleCropComplete}
        onClose={() => {
          setIsCropOpen(false);
          setCropImageSrc(null);
        }}
      />
    </form>
  );
};

export const NewUserOnboardingModal: React.FC = () => {
  const { isOnboardingOpen, setIsOnboardingOpen, currentUser } = usePartyStore();
  const { t } = useTranslation();

  if (!isOnboardingOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
        
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/85 backdrop-blur-xl"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 15 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative w-full max-w-lg rounded-[32px] bg-[#FFFDF8] dark:bg-[#1C1A16] border border-[#231E16]/10 dark:border-white/15 p-6 sm:p-8 shadow-2xl z-10 text-[#171512] dark:text-[#F5F1E8] my-auto select-none"
        >
          {/* Header Banner */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-[#F0DC00]/20 dark:bg-[#F0DC00]/15 border border-[#D8C700]/50 dark:border-[#F0DC00]/40 text-[#786300] dark:text-[#F0DC00] text-xs font-mono font-bold uppercase tracking-wider mb-3">
              <Sparkles className="w-3.5 h-3.5 text-[#8A7100] dark:text-[#F0DC00]" />
              <span>{t.onboarding.welcomeBadge}</span>
            </div>

            <h2 className="font-bubble text-3xl sm:text-5xl text-[#171512] dark:text-white tracking-tight leading-tight">
              {t.onboarding.howToCallYou}
            </h2>
            <p className="text-xs sm:text-sm text-[#57524A] dark:text-[#A8A196] mt-2 max-w-sm mx-auto leading-relaxed font-medium">
              {t.onboarding.subtitle}
            </p>
          </div>

          <OnboardingForm
            currentUser={currentUser}
            onClose={() => setIsOnboardingOpen(false)}
          />
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
