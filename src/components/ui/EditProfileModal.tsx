'use client';

import React, { useState } from 'react';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { GlassButton } from '@/components/ui/GlassButton';
import { usePartyStore } from '@/store/usePartyStore';
import { usePrivy } from '@privy-io/react-auth';
import { Check, Sparkles, AlertCircle, Camera, Link as LinkIcon } from 'lucide-react';

const AVATAR_PRESETS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=400&q=80',
];

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
  const [customUrl, setCustomUrl] = useState('');
  const [showCustomUrlInput, setShowCustomUrlInput] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  return (
    <form onSubmit={handleSave} className="space-y-6 pt-2 pb-6 px-1">
      {/* Avatar Preview & Selection */}
      <div className="flex flex-col items-center">
        <div className="relative group">
          <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden border-2 border-[#F0DC00] p-1 liquid-glass-card shadow-2xl flex items-center justify-center bg-black/40">
            {avatar ? (
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
            onClick={() => setShowCustomUrlInput(!showCustomUrlInput)}
            className="absolute bottom-0 right-0 p-2 rounded-full bg-[#F0DC00] text-black shadow-lg hover:scale-110 active:scale-95 transition-transform cursor-pointer"
            title="Agregar URL de imagen personalizada"
          >
            <Camera className="w-4 h-4" />
          </button>
        </div>

        <span className="text-xs text-white/50 mt-2 font-medium">Elige tu foto de fiesta</span>

        {/* Preset Avatars */}
        <div className="flex items-center gap-2.5 mt-3 overflow-x-auto max-w-full pb-1">
          {AVATAR_PRESETS.map((url, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setAvatar(url)}
              className={`relative w-10 h-10 rounded-full overflow-hidden border-2 transition-all shrink-0 cursor-pointer ${
                avatar === url
                  ? 'border-[#F0DC00] scale-110 shadow-[0_0_12px_rgba(240,220,0,0.5)]'
                  : 'border-white/20 hover:border-white/50 opacity-70 hover:opacity-100'
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt={`Preset ${idx + 1}`} className="w-full h-full object-cover" />
            </button>
          ))}
        </div>

        {/* Custom URL Input Toggle */}
        {showCustomUrlInput && (
          <div className="mt-3.5 w-full flex items-center gap-2 bg-white/5 border border-white/10 rounded-2xl p-2">
            <LinkIcon className="w-4 h-4 text-white/40 ml-1 shrink-0" />
            <input
              type="url"
              placeholder="https://images.unsplash.com/..."
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
