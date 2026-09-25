'use client';

import React, { useState } from 'react';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { GlassButton } from '@/components/ui/GlassButton';
import { usePartyStore } from '@/store/usePartyStore';
import { usePrivy } from '@privy-io/react-auth';
import { Check, Sparkles, AlertCircle, Camera, Link as LinkIcon } from 'lucide-react';

import { AvatarCropModal } from '@/components/ui/AvatarCropModal';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const EditProfileForm: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { currentUser, updateUser } = usePartyStore();
  const { authenticated, getAccessToken } = usePrivy();

  const [name, setName] = useState(currentUser.name || '');
  const [handle, setHandle] = useState(currentUser.handle?.replace(/^@/, '') || '');
  const [avatar, setAvatar] = useState(currentUser.avatar || '');
  const [coverImage, setCoverImage] = useState(currentUser.coverImage || '');
  const [customUrl, setCustomUrl] = useState('');
  const [showCustomUrlInput, setShowCustomUrlInput] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [isUploadingBanner, setIsUploadingBanner] = useState(false);
  const bannerFileInputRef = React.useRef<HTMLInputElement>(null);

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
      setError(bErr instanceof Error ? bErr.message : 'Error al subir la portada.');
    } finally {
      setIsUploadingBanner(false);
      if (bannerFileInputRef.current) bannerFileInputRef.current.value = '';
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Por favor ingresa un nombre.');
      return;
    }

    setIsSaving(true);
    setError(null);

    const handleRaw = handle.trim().replace(/^@/, '').toLowerCase().replace(/[^a-z0-9_]/g, '');
    if (handleRaw.length < 3 || handleRaw.length > 24) {
      setError('El @handle debe tener entre 3 y 24 caracteres (letras, números o guión bajo).');
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
        },
        token
      );

      onClose();
    } catch (saveErr: unknown) {
      console.error('Failed to save profile:', saveErr);
      const errMsg = saveErr instanceof Error ? saveErr.message : 'No se pudo actualizar el perfil.';
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

  const [isUploading, setIsUploading] = useState(false);
  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);
  const [isCropOpen, setIsCropOpen] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

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
      setError(uploadErr instanceof Error ? uploadErr.message : 'Error al subir la imagen.');
    } finally {
      setIsUploading(false);
      setCropImageSrc(null);
    }
  };

  return (
    <form onSubmit={handleSave} className="space-y-6 pt-2 pb-6 px-1">
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
      <div className="relative w-full h-24 sm:h-28 rounded-2xl overflow-hidden border border-white/15 bg-black/40 group">
        {coverImage ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img src={coverImage} alt="Cover Banner Preview" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-white/30 text-xs">
            Sin portada
          </div>
        )}
        <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
          <button
            type="button"
            onClick={() => bannerFileInputRef.current?.click()}
            disabled={isUploadingBanner}
            className="px-3 py-1.5 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-md text-white text-xs font-bold border border-white/30 flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
          >
            <Camera className="w-3.5 h-3.5" />
            <span>{isUploadingBanner ? 'Subiendo portada...' : 'Cambiar portada'}</span>
          </button>
        </div>
      </div>

      {/* Avatar Preview & Selection */}
      <div className="flex flex-col items-center -mt-8">
        <div className="relative group">
          <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden border-2 border-[#F0DC00] p-1 liquid-glass-card shadow-2xl flex items-center justify-center bg-black/40">
            {isUploading ? (
              <div className="w-full h-full rounded-full bg-black/70 flex flex-col items-center justify-center gap-1 text-[#F0DC00]">
                <div className="w-5 h-5 border-2 border-[#F0DC00] border-t-transparent rounded-full animate-spin" />
                <span className="text-[9px] font-mono uppercase tracking-widest text-white/80">Subiendo</span>
              </div>
            ) : avatar ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img src={avatar} alt="Avatar Preview" className="w-full h-full object-cover rounded-full" />
            ) : (
              <div className="w-full h-full rounded-full bg-[#F0DC00]/20 text-[#F0DC00] flex items-center justify-center font-display font-black text-3xl">
                {name ? name.charAt(0).toUpperCase() : 'G'}
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="absolute bottom-0 right-0 p-2 rounded-full bg-[#F0DC00] text-black shadow-lg hover:scale-110 active:scale-95 transition-transform cursor-pointer disabled:opacity-50"
            title="Subir foto desde tu dispositivo o cámara"
          >
            <Camera className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center gap-3 mt-3">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="px-3.5 py-1.5 rounded-full bg-[#F0DC00]/15 border border-[#F0DC00]/40 text-[#F0DC00] text-xs font-bold hover:bg-[#F0DC00]/25 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <Camera className="w-3.5 h-3.5" />
            <span>{isUploading ? 'Subiendo...' : 'Subir tu foto'}</span>
          </button>

          <button
            type="button"
            onClick={() => setShowCustomUrlInput(!showCustomUrlInput)}
            className="text-xs text-white/40 hover:text-white/70 transition-colors flex items-center gap-1 cursor-pointer"
          >
            <LinkIcon className="w-3 h-3" />
            <span>Pegar URL</span>
          </button>
        </div>

        {/* Custom URL Input Toggle */}
        {showCustomUrlInput && (
          <div className="mt-3.5 w-full flex items-center gap-2 bg-white/5 border border-white/10 rounded-2xl p-2">
            <LinkIcon className="w-4 h-4 text-white/40 ml-1 shrink-0" />
            <input
              type="url"
              placeholder="https://..."
              value={customUrl}
              onChange={(e) => setCustomUrl(e.target.value)}
              className="bg-transparent text-xs text-white outline-none flex-1 placeholder:text-white/30"
            />
            <button
              type="button"
              onClick={handleApplyCustomUrl}
              className="px-3 py-1.5 rounded-xl bg-[#F0DC00] text-black font-bold text-xs hover:brightness-110 cursor-pointer"
            >
              Usar
            </button>
          </div>
        )}
      </div>

      {/* Inputs */}
      <div className="space-y-4">
        <div>
          <label className="block text-xs uppercase font-extrabold tracking-wider text-white/70 mb-1.5">
            Nombre
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Tu nombre"
            maxLength={40}
            className="w-full px-4 py-3 rounded-2xl liquid-glass-card border border-white/15 bg-black/30 text-white font-medium text-sm focus:border-[#F0DC00] outline-none transition-colors"
          />
        </div>

        <div>
          <label className="block text-xs uppercase font-extrabold tracking-wider text-white/70 mb-1.5">
            Handle / Usuario
          </label>
          <div className="relative flex items-center">
            <span className="absolute left-4 text-sm font-semibold text-white/40">@</span>
            <input
              type="text"
              value={handle}
              onChange={(e) => setHandle(e.target.value)}
              placeholder="usuario"
              maxLength={30}
              className="w-full pl-8 pr-4 py-3 rounded-2xl liquid-glass-card border border-white/15 bg-black/30 text-white font-medium text-sm focus:border-[#F0DC00] outline-none transition-colors"
            />
          </div>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-500/10 border border-rose-500/25 text-xs text-rose-300">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={onClose}
          className="flex-1 py-3 px-4 rounded-2xl liquid-glass-button text-sm font-bold text-white/70 hover:text-white cursor-pointer"
        >
          Cancelar
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
            {isSaving ? 'Guardando...' : 'Guardar'}
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
  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title="Editar Perfil">
      {isOpen && <EditProfileForm onClose={onClose} />}
    </BottomSheet>
  );
};
