'use client';

import React, { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ZoomIn, ZoomOut, RotateCw, Check, Move } from 'lucide-react';
import { GlassButton } from '@/components/ui/GlassButton';
import { useTranslation } from '@/lib/i18n/useTranslation';

interface AvatarCropModalProps {
  isOpen: boolean;
  imageSrc: string | null;
  onCropComplete: (croppedBlob: Blob, previewUrl: string) => Promise<void> | void;
  onClose: () => void;
}

const VIEWPORT_SIZE = 260; // Diameter of circular crop aperture

interface AvatarCropDialogProps {
  imageSrc: string;
  onCropComplete: (croppedBlob: Blob, previewUrl: string) => Promise<void> | void;
  onClose: () => void;
}

const AvatarCropDialog: React.FC<AvatarCropDialogProps> = ({
  imageSrc,
  onCropComplete,
  onClose,
}) => {
  const { language } = useTranslation();
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0); // 0, 90, 180, 270
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isImageLoading, setIsImageLoading] = useState(true);
  const [imgDimensions, setImgDimensions] = useState<{ width: number; height: number } | null>(null);

  const imageRef = useRef<HTMLImageElement | null>(null);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const initialOffsetRef = useRef({ x: 0, y: 0 });

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const naturalW = e.currentTarget.naturalWidth;
    const naturalH = e.currentTarget.naturalHeight;
    if (naturalW && naturalH) {
      setImgDimensions({ width: naturalW, height: naturalH });
    }
    setIsImageLoading(false);
  };

  // Base displayed dimensions inside viewport before zoom
  let baseW = VIEWPORT_SIZE;
  let baseH = VIEWPORT_SIZE;
  if (imgDimensions && imgDimensions.height > 0) {
    const aspect = imgDimensions.width / imgDimensions.height;
    if (aspect >= 1) {
      baseW = Math.round(VIEWPORT_SIZE * aspect);
      baseH = VIEWPORT_SIZE;
    } else {
      baseW = VIEWPORT_SIZE;
      baseH = Math.round(VIEWPORT_SIZE / aspect);
    }
  }

  // Pointer drag handling for image panning
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    initialOffsetRef.current = { ...offset };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;

    // Generous bounding box allowing smooth panoramic panning without losing image
    const maxOffsetX = Math.max(VIEWPORT_SIZE * 0.5, (baseW * zoom) / 2);
    const maxOffsetY = Math.max(VIEWPORT_SIZE * 0.5, (baseH * zoom) / 2);

    const clampedX = Math.max(-maxOffsetX, Math.min(maxOffsetX, initialOffsetRef.current.x + dx));
    const clampedY = Math.max(-maxOffsetY, Math.min(maxOffsetY, initialOffsetRef.current.y + dy));

    setOffset({
      x: clampedX,
      y: clampedY,
    });
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isDragging) {
      setIsDragging(false);
      try {
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {
        // Ignored if pointer not captured
      }
    }
  };

  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    const delta = e.deltaY < 0 ? 0.1 : -0.1;
    setZoom((prev) => Math.min(3, Math.max(1, +(prev + delta).toFixed(2))));
  };

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  const handleApplyCrop = useCallback(async () => {
    if (!imageRef.current) return;
    setIsProcessing(true);

    try {
      const img = imageRef.current;
      const naturalW = img.naturalWidth;
      const naturalH = img.naturalHeight;

      // Base displayed dimensions inside viewport before zoom
      const aspect = naturalW / naturalH;
      let calculatedW = VIEWPORT_SIZE;
      let calculatedH = VIEWPORT_SIZE;
      if (aspect >= 1) {
        calculatedW = VIEWPORT_SIZE * aspect;
      } else {
        calculatedH = VIEWPORT_SIZE / aspect;
      }

      // Desired export resolution (512x512)
      const exportSize = 512;
      const canvas = document.createElement('canvas');
      canvas.width = exportSize;
      canvas.height = exportSize;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Could not create canvas 2D context');

      // Fill transparent/black background
      ctx.clearRect(0, 0, exportSize, exportSize);

      // Map scale from screen preview to export resolution
      const screenToExport = exportSize / VIEWPORT_SIZE;

      ctx.save();
      // Move to center of canvas
      ctx.translate(exportSize / 2, exportSize / 2);

      // Apply screen offset & rotation
      ctx.translate(offset.x * screenToExport, offset.y * screenToExport);
      ctx.rotate((rotation * Math.PI) / 180);
      ctx.scale(zoom, zoom);

      // Draw image centered at origin
      const drawW = calculatedW * screenToExport;
      const drawH = calculatedH * screenToExport;
      ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);
      ctx.restore();

      canvas.toBlob(
        async (blob) => {
          if (!blob) {
            canvas.toBlob(
              async (jpegBlob) => {
                if (!jpegBlob) {
                  setIsProcessing(false);
                  return;
                }
                const fallbackUrl = URL.createObjectURL(jpegBlob);
                await onCropComplete(jpegBlob, fallbackUrl);
                setIsProcessing(false);
                onClose();
              },
              'image/jpeg',
              0.88
            );
            return;
          }
          const croppedUrl = URL.createObjectURL(blob);
          await onCropComplete(blob, croppedUrl);
          setIsProcessing(false);
          onClose();
        },
        'image/webp',
        0.85
      );
    } catch (err) {
      console.error('Error generating cropped avatar:', err);
      setIsProcessing(false);
    }
  }, [offset, zoom, rotation, onCropComplete, onClose]);

  const isEs = language === 'es';

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.94 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.94 }}
          transition={{ duration: 0.2 }}
          data-disable-swipe-back="true"
          className="relative w-full max-w-sm rounded-3xl bg-[#141414] border border-white/15 p-5 shadow-2xl flex flex-col items-center"
        >
          {/* Header */}
          <div className="w-full flex items-center justify-between pb-3 border-b border-white/10">
            <div>
              <h3 className="font-display font-extrabold text-base text-white tracking-wide">
                {isEs ? 'Ajustar foto de perfil' : 'Adjust profile picture'}
              </h3>
              <p className="text-[11px] text-white/50">
                {isEs ? 'Arrastra para encuadrar y ajusta el zoom' : 'Drag to frame and adjust zoom'}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              disabled={isProcessing}
              className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white/70 hover:text-white transition-colors cursor-pointer disabled:opacity-50"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Viewport Frame */}
          <div className="relative my-4 flex items-center justify-center select-none touch-none">
            <div
              className="relative overflow-hidden rounded-full cursor-grab active:cursor-grabbing border-2 border-[#F0DC00] shadow-[0_0_25px_rgba(240,220,0,0.35)] bg-black/40"
              style={{ width: VIEWPORT_SIZE, height: VIEWPORT_SIZE }}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
              onWheel={handleWheel}
            >
              {/* Target Image with transform */}
              <div
                className="absolute inset-0 flex items-center justify-center pointer-events-none"
                style={{
                  transform: `translate(${offset.x}px, ${offset.y}px) rotate(${rotation}deg) scale(${zoom})`,
                  transformOrigin: 'center center',
                  transition: isDragging ? 'none' : 'transform 0.05s ease-out',
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  ref={imageRef}
                  src={imageSrc}
                  alt="Crop Target"
                  onLoad={handleImageLoad}
                  className="max-w-none pointer-events-none select-none"
                  style={{
                    width: `${baseW}px`,
                    height: `${baseH}px`,
                    objectFit: 'cover',
                    display: isImageLoading ? 'none' : 'block',
                  }}
                  draggable={false}
                />
              </div>

              {/* Loading spinner while blob image decodes */}
              {isImageLoading && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/70 text-[#F0DC00]">
                  <div className="w-7 h-7 border-2 border-[#F0DC00] border-t-transparent rounded-full animate-spin" />
                  <span className="text-[10px] font-mono text-white/70">
                    {isEs ? 'Cargando imagen...' : 'Loading image...'}
                  </span>
                </div>
              )}

              {/* Crosshair indicator while dragging */}
              {isDragging && !isImageLoading && (
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-30">
                  <div className="w-full h-px bg-white" />
                  <div className="h-full w-px bg-white absolute" />
                </div>
              )}
            </div>

            {/* Helper floating hint */}
            <div className="absolute bottom-2 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-sm border border-white/15 text-[10px] text-white/80 flex items-center gap-1 pointer-events-none">
              <Move className="w-3 h-3 text-[#F0DC00]" />
              <span>{isEs ? 'Mover imagen' : 'Pan image'}</span>
            </div>
          </div>

          {/* Controls Bar */}
          <div className="w-full space-y-3 pt-2 border-t border-white/10">
            {/* Zoom Slider */}
            <div className="flex items-center gap-3">
              <ZoomOut className="w-4 h-4 text-white/50 shrink-0" />
              <input
                type="range"
                min="1"
                max="3"
                step="0.05"
                value={zoom}
                onChange={(e) => setZoom(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer accent-[#F0DC00]"
              />
              <ZoomIn className="w-4 h-4 text-white/50 shrink-0" />
            </div>

            {/* Rotate & Reset Action Pills */}
            <div className="flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={handleRotate}
                className="flex-1 py-2 px-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-white/80 hover:text-white flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <RotateCw className="w-3.5 h-3.5" />
                <span>{isEs ? 'Girar 90°' : 'Rotate'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setZoom(1);
                  setOffset({ x: 0, y: 0 });
                  setRotation(0);
                }}
                className="px-3.5 py-2 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-white/50 hover:text-white transition-colors cursor-pointer"
              >
                {isEs ? 'Reiniciar' : 'Reset'}
              </button>
            </div>
          </div>

          {/* Actions */}
          <div className="w-full flex items-center gap-2.5 mt-5">
            <GlassButton
              variant="subtle"
              size="md"
              fullWidth
              onClick={onClose}
              disabled={isProcessing}
            >
              {isEs ? 'Cancelar' : 'Cancel'}
            </GlassButton>

            <GlassButton
              variant="accent"
              size="md"
              fullWidth
              onClick={handleApplyCrop}
              disabled={isProcessing || isImageLoading}
              icon={
                isProcessing ? (
                  <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Check className="w-4 h-4 text-black stroke-[3]" />
                )
              }
            >
              {isProcessing
                ? isEs
                  ? 'Guardando...'
                  : 'Saving...'
                : isEs
                ? 'Aplicar'
                : 'Apply'}
            </GlassButton>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export const AvatarCropModal: React.FC<AvatarCropModalProps> = ({
  isOpen,
  imageSrc,
  onCropComplete,
  onClose,
}) => {
  if (!isOpen || !imageSrc) return null;

  return (
    <AvatarCropDialog
      key={imageSrc}
      imageSrc={imageSrc}
      onCropComplete={onCropComplete}
      onClose={onClose}
    />
  );
};
