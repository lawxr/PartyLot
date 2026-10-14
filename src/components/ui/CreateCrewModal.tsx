'use client';

import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Users, Sparkles, ShieldCheck, Camera, Loader2, Check } from 'lucide-react';
import { usePartyStore } from '@/store/usePartyStore';
import { GlassButton } from '@/components/ui/GlassButton';
import { uploadImageFile } from '@/services/storageService';
import { Avatar } from '@/components/ui/Avatar';
import { useTranslation } from '@/lib/i18n/useTranslation';

interface CreateCrewModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const COVER_PRESETS = [
  {
    name: 'Sunset Glow',
    url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="800" height="800" viewBox="0 0 800 800"><defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%23F0DC00"/><stop offset="100%" stop-color="%23FF5722"/></linearGradient></defs><rect width="800" height="800" fill="url(%23g)"/></svg>',
  },
  {
    name: 'Midnight Amber',
    url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="800" height="800" viewBox="0 0 800 800"><defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%232C241D"/><stop offset="100%" stop-color="%23F0DC00"/></linearGradient></defs><rect width="800" height="800" fill="url(%23g)"/></svg>',
  },
  {
    name: 'Warm Hearth',
    url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="800" height="800" viewBox="0 0 800 800"><defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%231E1B18"/><stop offset="100%" stop-color="%23382D20"/></linearGradient></defs><rect width="800" height="800" fill="url(%23g)"/></svg>',
  },
];

export const CreateCrewModal: React.FC<CreateCrewModalProps> = ({ isOpen, onClose }) => {
  const { createCrew, getPastPartyPeers } = usePartyStore();
  const { language } = useTranslation();
  const isEs = language === 'es';
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedCover, setSelectedCover] = useState(COVER_PRESETS[0].url);
  const [selectedPeerIds, setSelectedPeerIds] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const pastPeers = getPastPartyPeers();

  if (!isOpen) return null;

  const togglePeer = (peerId: string) => {
    setSelectedPeerIds((prev) =>
      prev.includes(peerId) ? prev.filter((id) => id !== peerId) : [...prev, peerId]
    );
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError(null);
    setIsUploading(true);
    try {
      const url = await uploadImageFile(file, 'crews');
      setSelectedCover(url);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : (isEs ? 'Error al subir la imagen' : 'Error uploading image');
      setUploadError(msg);
    } finally {
      setIsUploading(false);
      if (e.target) e.target.value = '';
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);

    const initialMembers = pastPeers
      .filter((p) => selectedPeerIds.includes(p.id))
      .map((p) => ({
        id: p.id,
        userId: p.id,
        name: p.name,
        handle: p.handle,
        avatar: p.avatar,
        walletAddress: p.walletAddress,
        nightsTogether: p.nightsTogether,
      }));

    createCrew({
      name: name.trim(),
      description: description.trim() || 'Private trust network for gatherings.',
      coverImage: selectedCover,
      initialMembers,
    });

    setIsSubmitting(false);
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative z-10 w-full max-w-lg overflow-hidden rounded-[32px] border border-[rgba(35,30,22,0.12)] bg-[#FFFDF8] p-6 shadow-[0_24px_70px_rgba(65,48,25,0.18)]"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-[rgba(35,30,22,0.08)] mb-5">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-2xl bg-[#F0DC00]/25 border border-[#F0DC00]/40 flex items-center justify-center text-[#171512]">
                <Users className="w-4 h-4 stroke-[2.5]" />
              </div>
              <div>
                <h3 className="font-display font-extrabold text-xl text-[#171512]">
                  {isEs ? 'Crear Nuevo Crew' : 'Create New Crew'}
                </h3>
                <p className="text-[11px] text-[#6F6A62]">
                  {isEs ? 'Grupo duradero para organizar fiestas recurrentes' : 'Durable group container for recurring gatherings'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-[#F8F3EA] hover:bg-[#F1EADF] flex items-center justify-center text-[#171512] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Crew Name */}
            <div>
              <label className="block text-xs uppercase font-mono tracking-wider text-[#6F6A62] mb-1.5">
                {isEs ? 'Nombre del Crew *' : 'Crew Name *'}
              </label>
              <input
                type="text"
                required
                placeholder={isEs ? 'Ej. 404 House, Monad Hackers, Roomies' : 'e.g. 404 House, Monad Hackers, Roomies'}
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl bg-[#F8F3EA] border border-[rgba(35,30,22,0.1)] focus:border-[#F0DC00] focus:ring-1 focus:ring-[#F0DC00] text-[#171512] placeholder-[#8E887E] text-sm outline-none transition-all shadow-sm"
              />
            </div>

            {/* Crew Description */}
            <div>
              <label className="block text-xs uppercase font-mono tracking-wider text-[#6F6A62] mb-1.5">
                {isEs ? 'Vibra / Misión' : 'Vibe / Mission'}
              </label>
              <input
                type="text"
                placeholder={isEs ? 'Ej. Sesiones secretas en rooftop, afters y fiestas' : 'e.g. Secret rooftop sessions, late night builds & afters'}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl bg-[#F8F3EA] border border-[rgba(35,30,22,0.1)] focus:border-[#F0DC00] focus:ring-1 focus:ring-[#F0DC00] text-[#171512] placeholder-[#8E887E] text-sm outline-none transition-all shadow-sm"
              />
            </div>

            {/* Cover Image Selector */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs uppercase font-mono tracking-wider text-[#6F6A62]">
                  {isEs ? 'Foto de Portada' : 'Cover Photography'}
                </label>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="text-[11px] text-[#B8A700] hover:underline flex items-center gap-1 font-mono font-bold cursor-pointer disabled:opacity-50"
                >
                  <Camera className="w-3 h-3" />
                  {isUploading ? (isEs ? 'Subiendo...' : 'Uploading...') : (isEs ? 'Subir foto' : 'Upload photo')}
                </button>
              </div>

              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="hidden"
                onChange={handleFileUpload}
              />

              {uploadError && (
                <div className="mb-2 text-xs text-rose-700 bg-rose-500/10 border border-rose-500/20 px-3 py-1.5 rounded-xl">
                  {uploadError}
                </div>
              )}

              <div className="grid grid-cols-6 gap-2">
                {/* Upload Button Tile */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className={`relative aspect-square rounded-xl border-2 border-dashed border-black/20 hover:border-[#F0DC00] flex flex-col items-center justify-center gap-1 bg-white/40 transition-all cursor-pointer ${
                    isUploading ? 'animate-pulse' : ''
                  }`}
                  title={isEs ? 'Subir foto desde dispositivo' : 'Upload photo from device'}
                >
                  {isUploading ? (
                    <Loader2 className="w-4 h-4 animate-spin text-[#B8A700]" />
                  ) : (
                    <>
                      <Camera className="w-4 h-4 text-[#6F6A62]" />
                      <span className="text-[9px] font-bold text-[#6F6A62]">
                        {isEs ? 'Subir' : 'Upload'}
                      </span>
                    </>
                  )}
                </button>

                {/* Preset Tiles */}
                {COVER_PRESETS.map((preset) => (
                  <button
                    key={preset.name}
                    type="button"
                    onClick={() => setSelectedCover(preset.url)}
                    className={`relative aspect-square rounded-xl overflow-hidden border-2 transition-all group ${
                      selectedCover === preset.url
                        ? 'border-[#171512] scale-105 shadow-sm'
                        : 'border-transparent opacity-70 hover:opacity-100'
                    }`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={preset.url}
                      alt={preset.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Past Party Attendees / Peers */}
            {pastPeers.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs uppercase font-mono tracking-wider text-[#6F6A62]">
                    {isEs
                      ? `Personas con las que has ido a fiesta (${selectedPeerIds.length} seleccionadas)`
                      : `People you've partied with (${selectedPeerIds.length} selected)`}
                  </label>
                  {selectedPeerIds.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setSelectedPeerIds([])}
                      className="text-[11px] text-[#8E887E] hover:underline cursor-pointer"
                    >
                      {isEs ? 'Limpiar' : 'Clear'}
                    </button>
                  )}
                </div>
                <div className="max-h-40 overflow-y-auto space-y-1.5 p-2 rounded-2xl bg-[#F8F3EA] border border-[rgba(35,30,22,0.08)]">
                  {pastPeers.map((peer) => {
                    const isSelected = selectedPeerIds.includes(peer.id);
                    return (
                      <div
                        key={peer.id}
                        onClick={() => togglePeer(peer.id)}
                        className={`flex items-center justify-between p-2 rounded-xl cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-[#F0DC00]/30 border border-[#F0DC00]/50 shadow-xs'
                            : 'hover:bg-black/5 border border-transparent'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <Avatar
                            user={{
                              name: peer.name,
                              avatar: peer.avatar,
                              id: peer.id,
                            }}
                            size="sm"
                          />
                          <div className="min-w-0">
                            <span className="text-xs font-bold text-[#171512] block truncate">
                              {peer.name}
                            </span>
                            <span className="text-[10px] text-[#6F6A62]">
                              {peer.nightsTogether}{' '}
                              {isEs
                                ? peer.nightsTogether === 1
                                  ? 'noche juntos'
                                  : 'noches juntos'
                                : peer.nightsTogether === 1
                                ? 'night together'
                                : 'nights together'}
                            </span>
                          </div>
                        </div>

                        <div
                          className={`w-5 h-5 rounded-md flex items-center justify-center border transition-all ${
                            isSelected
                              ? 'bg-[#171512] border-[#171512] text-white'
                              : 'border-black/20 bg-white'
                          }`}
                        >
                          {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Trust Network Notice */}
            <div className="p-3 rounded-2xl bg-[#F0DC00]/15 border border-[#F0DC00]/30 flex items-start gap-2.5">
              <ShieldCheck className="w-4 h-4 text-[#B8A700] shrink-0 mt-0.5" />
              <p className="text-[11px] text-[#171512] leading-relaxed">
                {isEs ? (
                  <>Serás el <strong className="text-[#171512] font-extrabold">Dueño</strong> de este Crew. Tus miembros compartirán estadísticas, recuerdos y acceso a reuniones privadas.</>
                ) : (
                  <>You will be the <strong className="text-[#171512] font-extrabold">Owner</strong> of this Crew. Your members will share collective stats, memories, and access to private gatherings.</>
                )}
              </p>
            </div>

            {/* Submit */}
            <div className="pt-2 flex items-center justify-end gap-3">
              <GlassButton type="button" variant="glass" size="md" onClick={onClose}>
                {isEs ? 'Cancelar' : 'Cancel'}
              </GlassButton>
              <GlassButton
                type="submit"
                variant="accent"
                size="md"
                disabled={!name.trim() || isSubmitting}
                icon={<Sparkles className="w-4 h-4 text-black stroke-[2.5]" />}
              >
                {isEs ? 'Crear Crew Hub' : 'Create Crew Hub'}
              </GlassButton>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
