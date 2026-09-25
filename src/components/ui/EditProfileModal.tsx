'use client';

import React, { useState } from 'react';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { GlassButton } from '@/components/ui/GlassButton';
import { usePartyStore } from '@/store/usePartyStore';
import { usePrivy } from '@privy-io/react-auth';
import {
  Check,
  Sparkles,
  AlertCircle,
  Camera,
  Link as LinkIcon,
  MapPin,
  Globe,
} from 'lucide-react';
import { AvatarCropModal } from '@/components/ui/AvatarCropModal';
import { useTranslation } from '@/lib/i18n/useTranslation';

const InstagramIcon: React.FC<{ className?: string }> = ({ className = 'w-3.5 h-3.5' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
  </svg>
);

const TwitterIcon: React.FC<{ className?: string }> = ({ className = 'w-3.5 h-3.5' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const EditProfileForm: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { currentUser, updateUser } = usePartyStore();
  const { authenticated, getAccessToken } = usePrivy();
  const { language } = useTranslation();
  const isEs = language === 'es';

  // Standard Social Profile Fields
  const [name, setName] = useState(currentUser.name || '');
  const [handle, setHandle] = useState(currentUser.handle?.replace(/^@/, '') || '');
  const [bio, setBio] = useState(currentUser.bio || '');
  const [location, setLocation] = useState(currentUser.location || '');
  const [website, setWebsite] = useState(currentUser.website || '');
  const [instagram, setInstagram] = useState(currentUser.instagram?.replace(/^@/, '') || '');
  const [twitter, setTwitter] = useState(currentUser.twitter?.replace(/^@/, '') || '');
  const [avatar, setAvatar] = useState(currentUser.avatar || '');
  const [coverImage, setCoverImage] = useState(currentUser.coverImage || '');

  const [customUrl, setCustomUrl] = useState('');
  const [showCustomUrlInput, setShowCustomUrlInput] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [isUploadingBanner, setIsUploadingBanner] = useState(false);
  const bannerFileInputRef = React.useRef<HTMLInputElement>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);
  const [isCropOpen, setIsCropOpen] = useState(false);

  const handleBannerFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingBanner(true);
    setError(null);
    try {
      const { uploadImageFile } = await import('@/services/storageService');
      const uploadedUrl = await uploadImageFile(file, 'banners');
      setCoverImage(uploadedUrl);
    } catch (bErr) {
      console.error('Banner upload failed:', bErr);
      setError(bErr instanceof Error ? bErr.message : (isEs ? 'Error al subir la portada.' : 'Failed to upload cover banner.'));
    } finally {
      setIsUploadingBanner(false);
      if (bannerFileInputRef.current) bannerFileInputRef.current.value = '';
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
      const { uploadImageFile } = await import('@/services/storageService');
      const uploadedUrl = await uploadImageFile(croppedBlob, 'avatars');
      setAvatar(uploadedUrl);
    } catch (uploadErr) {
      console.error('Avatar upload failed:', uploadErr);
      setError(uploadErr instanceof Error ? uploadErr.message : (isEs ? 'Error al subir el avatar.' : 'Failed to upload avatar.'));
    } finally {
      setIsUploading(false);
      setCropImageSrc(null);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError(isEs ? 'Por favor ingresa un nombre.' : 'Please enter your name.');
      return;
    }

    setIsSaving(true);
    setError(null);

    const handleRaw = handle.trim().replace(/^@/, '').toLowerCase().replace(/[^a-z0-9_]/g, '');
    if (handleRaw.length < 3 || handleRaw.length > 24) {
      setError(isEs ? 'El @handle debe tener entre 3 y 24 caracteres (letras, números o guión bajo).' : 'Handle must be 3-24 characters (letters, numbers, underscores).');
      setIsSaving(false);
      return;
    }
    const formattedHandle = `@${handleRaw}`;

    try {
      let token: string | null = null;
      if (authenticated) {
        try {
          token = await getAccessToken();
        } catch (tErr) {
          console.warn('Could not retrieve Privy token:', tErr);
        }
      }

      await updateUser(
        {
          name: name.trim(),
          handle: formattedHandle,
          avatar: avatar.trim() || undefined,
          coverImage: coverImage.trim() || undefined,
          bio: bio.trim(),
          location: location.trim(),
          website: website.trim() || undefined,
          instagram: instagram.trim() ? instagram.trim().replace(/^@/, '') : undefined,
          twitter: twitter.trim() ? twitter.trim().replace(/^@/, '') : undefined,
        },
        token
      );

      onClose();
    } catch (saveErr: unknown) {
      console.error('Failed to save profile:', saveErr);
      const errMsg = saveErr instanceof Error ? saveErr.message : (isEs ? 'No se pudo actualizar el perfil.' : 'Failed to update profile.');
      setError(errMsg);
    } finally {
      setIsSaving(false);
    }
  };

  const handleApplyCustomUrl = () => {
    if (customUrl.trim()) {
      setAvatar(customUrl.trim());
      setShowCustomUrlInput(false);
      setCustomUrl('');
    }
  };

  return (
    <form onSubmit={handleSave} className="space-y-5 pt-1 pb-6 px-1">
      {/* Hidden file inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={handleFileChange}
      />
      <input
        ref={bannerFileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={handleBannerFileChange}
      />

      {/* Cover Banner Preview & Change */}
      <div>
        <div className="relative w-full h-28 sm:h-32 rounded-2xl overflow-hidden border border-black/10 dark:border-white/15 bg-black/10 dark:bg-black/40 group">
          {coverImage ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src={coverImage} alt="Cover Banner Preview" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-[#8E887E] dark:text-white/40 text-xs font-semibold">
              {isEs ? 'Sin portada' : 'No cover banner'}
            </div>
          )}
          <div className="absolute inset-0 bg-black/25 flex items-center justify-center">
            <button
              type="button"
              onClick={() => bannerFileInputRef.current?.click()}
              disabled={isUploadingBanner}
              className="px-3.5 py-1.5 rounded-full bg-black/70 hover:bg-black/85 backdrop-blur-md text-white text-xs font-bold border border-white/30 flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50 shadow-md"
            >
              <Camera className="w-3.5 h-3.5 text-[#F0DC00]" />
              <span>{isUploadingBanner ? (isEs ? 'Subiendo...' : 'Uploading...') : (isEs ? 'Cambiar portada' : 'Change banner')}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Avatar Preview & Selection */}
      <div className="flex flex-col items-center -mt-9">
        <div className="relative group">
          <div className="w-22 h-22 sm:w-24 sm:h-24 rounded-full overflow-hidden border-4 border-white dark:border-[#1C1A16] shadow-xl flex items-center justify-center bg-black/10 dark:bg-black/50">
            {isUploading ? (
              <div className="w-full h-full rounded-full bg-black/70 flex flex-col items-center justify-center gap-1 text-[#F0DC00]">
                <div className="w-5 h-5 border-2 border-[#F0DC00] border-t-transparent rounded-full animate-spin" />
                <span className="text-[9px] font-mono uppercase tracking-widest text-white/80">
                  {isEs ? 'Subiendo' : 'Uploading'}
                </span>
              </div>
            ) : avatar ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img src={avatar} alt="Avatar Preview" className="w-full h-full object-cover rounded-full" />
            ) : (
              <div className="w-full h-full rounded-full bg-[#F0DC00]/20 text-[#171512] dark:text-[#F0DC00] flex items-center justify-center font-display font-black text-2xl">
                {name ? name.charAt(0).toUpperCase() : 'L'}
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="absolute bottom-0 right-0 p-2 rounded-full bg-[#F0DC00] text-[#171512] shadow-md hover:scale-110 active:scale-95 transition-transform cursor-pointer disabled:opacity-50 border border-white dark:border-[#1C1A16]"
            title={isEs ? 'Subir foto de perfil' : 'Upload profile photo'}
          >
            <Camera className="w-3.5 h-3.5 stroke-[2.2]" />
          </button>
        </div>

        <div className="flex items-center gap-3 mt-2.5">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="px-3 py-1 rounded-full bg-[#F0DC00]/20 dark:bg-[#F0DC00]/15 text-[#171512] dark:text-[#F0DC00] text-xs font-bold hover:bg-[#F0DC00]/30 transition-all flex items-center gap-1 cursor-pointer disabled:opacity-50"
          >
            <Camera className="w-3 h-3" />
            <span>{isUploading ? (isEs ? 'Subiendo...' : 'Uploading...') : (isEs ? 'Cambiar avatar' : 'Change avatar')}</span>
          </button>

          <button
            type="button"
            onClick={() => setShowCustomUrlInput(!showCustomUrlInput)}
            className="text-xs text-[#8E887E] dark:text-white/40 hover:text-[#171512] dark:hover:text-white transition-colors flex items-center gap-1 cursor-pointer font-medium"
          >
            <LinkIcon className="w-3 h-3" />
            <span>URL</span>
          </button>
        </div>

        {/* Custom URL Input Toggle */}
        {showCustomUrlInput && (
          <div className="mt-3 w-full flex items-center gap-2 bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-2xl p-2">
            <LinkIcon className="w-4 h-4 text-[#8E887E] dark:text-white/40 ml-1 shrink-0" />
            <input
              type="url"
              placeholder="https://..."
              value={customUrl}
              onChange={(e) => setCustomUrl(e.target.value)}
              className="bg-transparent text-xs text-[#171512] dark:text-white outline-none flex-1 placeholder:text-[#8E887E]/50 dark:placeholder:text-white/30"
            />
            <button
              type="button"
              onClick={handleApplyCustomUrl}
              className="px-3 py-1.5 rounded-xl bg-[#F0DC00] text-[#171512] font-bold text-xs hover:brightness-105 cursor-pointer"
            >
              {isEs ? 'Usar' : 'Use'}
            </button>
          </div>
        )}
      </div>

      {/* Primary Identity Fields */}
      <div className="space-y-3.5">
        <div>
          <label className="block text-[11px] uppercase font-bold tracking-wider text-[#8E887E] dark:text-[#A8A196] mb-1">
            {isEs ? 'Nombre completo' : 'Full Name'}
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={isEs ? 'Tu nombre' : 'Your name'}
            maxLength={40}
            className="w-full px-3.5 py-2.5 rounded-xl border border-black/10 dark:border-white/15 bg-black/[0.02] dark:bg-white/5 text-[#171512] dark:text-white font-semibold text-sm focus:border-[#F0DC00] outline-none transition-colors"
          />
        </div>

        <div>
          <label className="block text-[11px] uppercase font-bold tracking-wider text-[#8E887E] dark:text-[#A8A196] mb-1">
            {isEs ? 'Usuario / Handle' : 'Username / Handle'}
          </label>
          <div className="relative flex items-center">
            <span className="absolute left-3.5 text-sm font-semibold text-[#8E887E] dark:text-white/40">@</span>
            <input
              type="text"
              value={handle}
              onChange={(e) => setHandle(e.target.value)}
              placeholder="usuario"
              maxLength={30}
              className="w-full pl-8 pr-3.5 py-2.5 rounded-xl border border-black/10 dark:border-white/15 bg-black/[0.02] dark:bg-white/5 text-[#171512] dark:text-white font-semibold text-sm focus:border-[#F0DC00] outline-none transition-colors"
            />
          </div>
        </div>

        {/* Bio / Description */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-[11px] uppercase font-bold tracking-wider text-[#8E887E] dark:text-[#A8A196]">
              {isEs ? 'Biografía' : 'Bio'}
            </label>
            <span className="text-[10px] text-[#8E887E] dark:text-[#A8A196] font-mono">
              {bio.length}/160
            </span>
          </div>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value.slice(0, 160))}
            placeholder={isEs ? 'Cuéntale a tu crew quién eres...' : 'Tell your crew who you are...'}
            rows={2}
            className="w-full px-3.5 py-2.5 rounded-xl border border-black/10 dark:border-white/15 bg-black/[0.02] dark:bg-white/5 text-[#171512] dark:text-white font-medium text-sm focus:border-[#F0DC00] outline-none transition-colors resize-none"
          />
        </div>

        {/* Location */}
        <div>
          <label className="block text-[11px] uppercase font-bold tracking-wider text-[#8E887E] dark:text-[#A8A196] mb-1">
            {isEs ? 'Ubicación' : 'Location'}
          </label>
          <div className="relative flex items-center">
            <MapPin className="absolute left-3.5 w-4 h-4 text-[#8E887E] dark:text-white/40" />
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Medellin, Colombia"
              maxLength={50}
              className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-black/10 dark:border-white/15 bg-black/[0.02] dark:bg-white/5 text-[#171512] dark:text-white font-medium text-sm focus:border-[#F0DC00] outline-none transition-colors"
            />
          </div>
        </div>

        {/* Links & Social Handles */}
        <div className="pt-2 border-t border-black/5 dark:border-white/10 space-y-3">
          <span className="text-xs font-bold text-[#171512] dark:text-white block">
            {isEs ? 'Enlaces y redes sociales' : 'Links & Socials'}
          </span>

          {/* Website */}
          <div className="relative flex items-center">
            <Globe className="absolute left-3.5 w-4 h-4 text-[#8E887E] dark:text-white/40" />
            <input
              type="url"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              placeholder="https://partylot.xyz/lawx"
              maxLength={80}
              className="w-full pl-10 pr-3.5 py-2 rounded-xl border border-black/10 dark:border-white/15 bg-black/[0.02] dark:bg-white/5 text-[#171512] dark:text-white font-medium text-xs focus:border-[#F0DC00] outline-none transition-colors"
            />
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            {/* Instagram */}
            <div className="relative flex items-center">
              <InstagramIcon className="absolute left-3 w-3.5 h-3.5 text-[#8E887E] dark:text-white/40" />
              <input
                type="text"
                value={instagram}
                onChange={(e) => setInstagram(e.target.value)}
                placeholder="instagram"
                maxLength={30}
                className="w-full pl-8 pr-2.5 py-2 rounded-xl border border-black/10 dark:border-white/15 bg-black/[0.02] dark:bg-white/5 text-[#171512] dark:text-white font-medium text-xs focus:border-[#F0DC00] outline-none transition-colors"
              />
            </div>

            {/* Twitter */}
            <div className="relative flex items-center">
              <TwitterIcon className="absolute left-3 w-3.5 h-3.5 text-[#8E887E] dark:text-white/40" />
              <input
                type="text"
                value={twitter}
                onChange={(e) => setTwitter(e.target.value)}
                placeholder="twitter / x"
                maxLength={30}
                className="w-full pl-8 pr-2.5 py-2 rounded-xl border border-black/10 dark:border-white/15 bg-black/[0.02] dark:bg-white/5 text-[#171512] dark:text-white font-medium text-xs focus:border-[#F0DC00] outline-none transition-colors"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-500/10 border border-rose-500/25 text-xs text-rose-600 dark:text-rose-300">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
          <span>{error}</span>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3 pt-3">
        <button
          type="button"
          onClick={onClose}
          className="flex-1 py-3 px-4 rounded-2xl bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/15 text-sm font-bold text-[#706B66] dark:text-white/80 transition-colors cursor-pointer"
        >
          {isEs ? 'Cancelar' : 'Cancel'}
        </button>
        <div className="flex-1">
          <GlassButton
            type="submit"
            variant="accent"
            fullWidth
            size="md"
            disabled={isSaving}
            icon={isSaving ? <Check className="w-4 h-4 text-black animate-spin" /> : <Sparkles className="w-4 h-4 text-black" />}
          >
            {isSaving ? (isEs ? 'Guardando...' : 'Saving...') : (isEs ? 'Guardar' : 'Save')}
          </GlassButton>
        </div>
      </div>

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

export const EditProfileModal: React.FC<EditProfileModalProps> = ({ isOpen, onClose }) => {
  const { language } = useTranslation();
  const isEs = language === 'es';

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title={isEs ? 'Editar Perfil' : 'Edit Profile'}>
      {isOpen && <EditProfileForm onClose={onClose} />}
    </BottomSheet>
  );
};
