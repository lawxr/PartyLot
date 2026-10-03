'use client';

import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Users, Sparkles, Image as ImageIcon, ShieldCheck, Camera, Loader2 } from 'lucide-react';
import { usePartyStore } from '@/store/usePartyStore';
import { GlassButton } from '@/components/ui/GlassButton';
import { uploadImageFile } from '@/services/storageService';

interface CreateCrewModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const COVER_PRESETS = [
  {
    name: 'Techno Bunker',
    url: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=800&q=80',
  },
  {
    name: 'Hacker House',
    url: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=800&q=80',
  },
  {
    name: 'Rooftop Sunset',
    url: 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?auto=format&fit=crop&w=800&q=80',
  },
  {
    name: 'Neon Cyber Loft',
    url: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=800&q=80',
  },
  {
    name: 'Festival Afters',
    url: 'https://images.unsplash.com/photo-1543007630-9710e4a00a20?auto=format&fit=crop&w=800&q=80',
  },
];

export const CreateCrewModal: React.FC<CreateCrewModalProps> = ({ isOpen, onClose }) => {
  const { createCrew } = usePartyStore();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedCover, setSelectedCover] = useState(COVER_PRESETS[0].url);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError(null);
    setIsUploading(true);
    try {
      const url = await uploadImageFile(file, 'crews');
      setSelectedCover(url);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al subir la imagen';
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

    createCrew({
      name: name.trim(),
      description: description.trim() || 'Private trust network for gatherings.',
      coverImage: selectedCover,
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
                <h3 className="font-display font-extrabold text-xl text-[#171512]">Create New Crew</h3>
                <p className="text-[11px] text-[#6F6A62]">Durable group container for recurring gatherings</p>
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
                Crew Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. 404 House, Monad Hackers, Roomies"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl bg-[#F8F3EA] border border-[rgba(35,30,22,0.1)] focus:border-[#F0DC00] focus:ring-1 focus:ring-[#F0DC00] text-[#171512] placeholder-[#8E887E] text-sm outline-none transition-all shadow-sm"
              />
            </div>

            {/* Crew Description */}
            <div>
              <label className="block text-xs uppercase font-mono tracking-wider text-[#6F6A62] mb-1.5">
                Vibe / Mission
              </label>
              <input
                type="text"
                placeholder="e.g. Secret rooftop sessions, late night builds & afters"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl bg-[#F8F3EA] border border-[rgba(35,30,22,0.1)] focus:border-[#F0DC00] focus:ring-1 focus:ring-[#F0DC00] text-[#171512] placeholder-[#8E887E] text-sm outline-none transition-all shadow-sm"
              />
            </div>

            {/* Cover Image Selector */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs uppercase font-mono tracking-wider text-[#6F6A62]">
                  Cover Photography
                </label>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="text-[11px] text-[#B8A700] hover:underline flex items-center gap-1 font-mono font-bold cursor-pointer disabled:opacity-50"
                >
                  <Camera className="w-3 h-3" />
                  {isUploading ? 'Subiendo...' : 'Subir foto'}
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
                  title="Subir foto desde dispositivo"
                >
                  {isUploading ? (
                    <Loader2 className="w-4 h-4 animate-spin text-[#B8A700]" />
                  ) : (
                    <>
                      <Camera className="w-4 h-4 text-[#6F6A62]" />
                      <span className="text-[9px] font-bold text-[#6F6A62]">Subir</span>
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

            {/* Trust Network Notice */}
            <div className="p-3 rounded-2xl bg-[#F0DC00]/15 border border-[#F0DC00]/30 flex items-start gap-2.5">
              <ShieldCheck className="w-4 h-4 text-[#B8A700] shrink-0 mt-0.5" />
              <p className="text-[11px] text-[#171512] leading-relaxed">
                You will be the <strong className="text-[#171512] font-extrabold">Owner</strong> of this Crew. Your members will share collective stats, memories, and access to private gatherings.
              </p>
            </div>

            {/* Submit */}
            <div className="pt-2 flex items-center justify-end gap-3">
              <GlassButton type="button" variant="glass" size="md" onClick={onClose}>
                Cancel
              </GlassButton>
              <GlassButton
                type="submit"
                variant="accent"
                size="md"
                disabled={!name.trim() || isSubmitting}
                icon={<Sparkles className="w-4 h-4 text-black stroke-[2.5]" />}
              >
                Create Crew Hub
              </GlassButton>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
