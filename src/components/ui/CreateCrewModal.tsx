'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Users, Sparkles, Image as ImageIcon, ShieldCheck } from 'lucide-react';
import { usePartyStore } from '@/store/usePartyStore';
import { GlassButton } from '@/components/ui/GlassButton';

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
  const [customCover, setCustomCover] = useState('');
  const [useCustomCover, setUseCustomCover] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    const cover = useCustomCover && customCover.trim() ? customCover.trim() : selectedCover;

    createCrew({
      name: name.trim(),
      description: description.trim() || 'Private trust network for gatherings.',
      coverImage: cover,
    });

    setIsSubmitting(false);
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/80 backdrop-blur-md"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative z-10 w-full max-w-lg overflow-hidden rounded-3xl border border-white/20 bg-[#0d0d12]/95 p-6 shadow-2xl backdrop-blur-2xl"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-5">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-2xl bg-[#F0DC00]/20 border border-[#F0DC00] flex items-center justify-center text-[#F0DC00]">
                <Users className="w-4 h-4 stroke-[2.5]" />
              </div>
              <div>
                <h3 className="font-display font-extrabold text-xl text-white">Create New Crew</h3>
                <p className="text-[11px] text-white/50">Durable group container for recurring gatherings</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/70 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Crew Name */}
            <div>
              <label className="block text-xs uppercase font-mono tracking-wider text-white/70 mb-1.5">
                Crew Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. 404 House, Monad Hackers, Roomies"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl bg-white/5 border border-white/15 focus:border-[#F0DC00] focus:ring-1 focus:ring-[#F0DC00] text-white placeholder-white/30 text-sm outline-none transition-all"
              />
            </div>

            {/* Crew Description */}
            <div>
              <label className="block text-xs uppercase font-mono tracking-wider text-white/70 mb-1.5">
                Vibe / Mission
              </label>
              <input
                type="text"
                placeholder="e.g. Secret rooftop sessions, late night builds & afters"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl bg-white/5 border border-white/15 focus:border-[#F0DC00] focus:ring-1 focus:ring-[#F0DC00] text-white placeholder-white/30 text-sm outline-none transition-all"
              />
            </div>

            {/* Cover Image Selector */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs uppercase font-mono tracking-wider text-white/70">
                  Cover Photography
                </label>
                <button
                  type="button"
                  onClick={() => setUseCustomCover(!useCustomCover)}
                  className="text-[11px] text-[#F0DC00] hover:underline flex items-center gap-1 font-mono"
                >
                  <ImageIcon className="w-3 h-3" />
                  {useCustomCover ? 'Select Preset' : 'Paste URL'}
                </button>
              </div>

              {useCustomCover ? (
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/..."
                  value={customCover}
                  onChange={(e) => setCustomCover(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl bg-white/5 border border-white/15 focus:border-[#F0DC00] text-white placeholder-white/30 text-xs outline-none"
                />
              ) : (
                <div className="grid grid-cols-5 gap-2">
                  {COVER_PRESETS.map((preset) => (
                    <button
                      key={preset.name}
                      type="button"
                      onClick={() => setSelectedCover(preset.url)}
                      className={`relative aspect-square rounded-xl overflow-hidden border-2 transition-all group ${
                        selectedCover === preset.url
                          ? 'border-[#F0DC00] scale-105 shadow-md shadow-[#F0DC00]/20'
                          : 'border-white/10 opacity-60 hover:opacity-100 hover:border-white/30'
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
              )}
            </div>

            {/* Trust Network Notice */}
            <div className="p-3 rounded-2xl bg-[#F0DC00]/5 border border-[#F0DC00]/20 flex items-start gap-2.5">
              <ShieldCheck className="w-4 h-4 text-[#F0DC00] shrink-0 mt-0.5" />
              <p className="text-[11px] text-white/70 leading-relaxed">
                You will be the <strong className="text-white">Owner</strong> of this Crew. Your members will share collective stats, memories, and access to private gatherings.
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
