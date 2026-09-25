'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Camera, Image as ImageIcon, AlertCircle, RefreshCw } from 'lucide-react';
import jsQR from 'jsqr';
import { useTranslation } from '@/lib/i18n/useTranslation';

interface QRScannerModalProps {
  isOpen: boolean;
  onScanSuccess: (code: string) => void;
  onClose: () => void;
}

export function extractPartyCode(scannedText: string): string | null {
  if (!scannedText) return null;
  const raw = scannedText.trim();

  // Try parsing as URL
  try {
    if (raw.includes('?') || raw.startsWith('http://') || raw.startsWith('https://')) {
      const url = new URL(raw, 'https://partylot.app');
      const code = url.searchParams.get('code') || url.searchParams.get('join');
      if (code && code.trim().length >= 4) {
        return code.trim().slice(0, 4).toUpperCase();
      }
    }
  } catch {
    // Continue to regex match
  }

  // Exact 4 alphanumeric chars
  const clean = raw.toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (clean.length === 4) {
    return clean;
  }

  // Look for code/join/party keyword prefix
  const keywordMatch = raw.match(/(?:code|join|party)[:\s=]+([A-Za-z0-9]{4})/i);
  if (keywordMatch) {
    return keywordMatch[1].toUpperCase();
  }

  // Find 4 consecutive alphanumeric characters if embedded in text
  const match = raw.toUpperCase().match(/\b[A-Z0-9]{4}\b/);
  return match ? match[0] : null;
}

export const QRScannerModal: React.FC<QRScannerModalProps> = ({
  isOpen,
  onScanSuccess,
  onClose,
}) => {
  const { language } = useTranslation();
  const isEs = language === 'es';

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Stop camera stream safely (pure side effect)
  const stopCamera = useCallback(() => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  }, []);

  const scanFrameRef = useRef<() => void>(() => {});

  // Frame processing loop with jsQR
  const scanFrame = useCallback(() => {
    if (!videoRef.current || videoRef.current.readyState !== videoRef.current.HAVE_ENOUGH_DATA) {
      animFrameRef.current = requestAnimationFrame(() => scanFrameRef.current());
      return;
    }

    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });

    if (ctx && canvas.width > 0 && canvas.height > 0) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: 'attemptBoth',
      });

      if (code && code.data) {
        const partyCode = extractPartyCode(code.data);
        if (partyCode) {
          try {
            navigator.vibrate?.(100);
          } catch {
            // Vibrate not supported or allowed
          }
          stopCamera();
          onScanSuccess(partyCode);
          onClose();
          return;
        }
      }
    }

    animFrameRef.current = requestAnimationFrame(() => scanFrameRef.current());
  }, [onScanSuccess, onClose, stopCamera]);

  useEffect(() => {
    scanFrameRef.current = scanFrame;
  }, [scanFrame]);

  // Start camera when modal opens
  const startCamera = useCallback(async () => {
    setErrorMessage(null);
    setHasCameraPermission(null);

    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error(
          isEs
            ? 'Tu navegador no permite acceso a la cámara en este contexto.'
            : 'Your browser does not support camera access in this context.'
        );
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setHasCameraPermission(true);
        animFrameRef.current = requestAnimationFrame(() => scanFrameRef.current());
      }
    } catch (err: unknown) {
      console.warn('Camera access failed:', err);
      setHasCameraPermission(false);
      const msg =
        err instanceof Error
          ? err.message
          : isEs
          ? 'No se pudo acceder a la cámara. Revisa los permisos de tu navegador.'
          : 'Could not access camera. Check your browser permissions.';
      setErrorMessage(msg);
    }
  }, [isEs]);

  useEffect(() => {
    let isCurrent = true;
    if (isOpen) {
      queueMicrotask(() => {
        if (isCurrent) {
          void startCamera();
        }
      });
    } else {
      stopCamera();
    }
    return () => {
      isCurrent = false;
      stopCamera();
    };
  }, [isOpen, startCamera, stopCamera]);

  // Handle uploading an image with a QR code
  const handleImageFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const decoded = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: 'attemptBoth',
      });

      if (decoded && decoded.data) {
        const partyCode = extractPartyCode(decoded.data);
        if (partyCode) {
          stopCamera();
          onScanSuccess(partyCode);
          onClose();
          return;
        }
      }

      setErrorMessage(
        isEs
          ? 'No se detectó un código QR válido en la imagen seleccionada.'
          : 'No valid QR code found in selected image.'
      );
      if (fileInputRef.current) fileInputRef.current.value = '';
    };

    img.src = URL.createObjectURL(file);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative w-full max-w-sm rounded-[32px] bg-[#FFFDF8] border border-[rgba(35,30,22,0.12)] p-5 shadow-[0_24px_70px_rgba(65,48,25,0.18)] flex flex-col items-center overflow-hidden"
        >
          {/* Header */}
          <div className="w-full flex items-center justify-between pb-3 border-b border-[rgba(35,30,22,0.08)]">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-[#F0DC00]/25 text-[#171512]">
                <Camera className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-display font-extrabold text-sm text-[#171512] tracking-wide">
                  {isEs ? 'Escanear QR de Invitación' : 'Scan Party QR Code'}
                </h3>
                <p className="text-[11px] text-[#6F6A62]">
                  {isEs ? 'Apunta al código en la pantalla de tu amigo' : 'Point camera at your friend’s screen'}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-full bg-[#F8F3EA] hover:bg-[#F1EADF] text-[#171512] transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Scanner Viewport */}
          <div className="relative w-full aspect-square max-w-[280px] my-4 rounded-2xl overflow-hidden bg-black border border-black/20 flex items-center justify-center shadow-inner">
            <video
              ref={videoRef}
              playsInline
              muted
              className="w-full h-full object-cover"
            />

            {/* Target Reticle Viewfinder */}
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <div className="relative w-48 h-48 border-2 border-[#F0DC00] rounded-2xl shadow-[0_0_30px_rgba(240,220,0,0.25)]">
                {/* Corner bracket accents */}
                <div className="absolute -top-1.5 -left-1.5 w-4 h-4 border-t-4 border-l-4 border-[#F0DC00]" />
                <div className="absolute -top-1.5 -right-1.5 w-4 h-4 border-t-4 border-r-4 border-[#F0DC00]" />
                <div className="absolute -bottom-1.5 -left-1.5 w-4 h-4 border-b-4 border-l-4 border-[#F0DC00]" />
                <div className="absolute -bottom-1.5 -right-1.5 w-4 h-4 border-b-4 border-r-4 border-[#F0DC00]" />

                {/* Animated scanning radar laser */}
                {hasCameraPermission === true && (
                  <motion.div
                    className="w-full h-0.5 bg-gradient-to-r from-transparent via-[#F0DC00] to-transparent shadow-[0_0_12px_#F0DC00]"
                    animate={{ y: [0, 185, 0] }}
                    transition={{
                      repeat: Infinity,
                      duration: 2.2,
                      ease: 'easeInOut',
                    }}
                  />
                )}
              </div>
            </div>

            {/* Camera error / permission fallback */}
            {hasCameraPermission === false && (
              <div className="absolute inset-0 bg-black/90 p-4 flex flex-col items-center justify-center text-center gap-2.5">
                <AlertCircle className="w-8 h-8 text-rose-400" />
                <p className="text-xs text-white/90 font-medium">{errorMessage}</p>
                <button
                  type="button"
                  onClick={startCamera}
                  className="mt-1 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>{isEs ? 'Reintentar' : 'Retry'}</span>
                </button>
              </div>
            )}
          </div>

          {/* Upload image alternative */}
          <div className="w-full flex flex-col items-center gap-2 pt-1 border-t border-[rgba(35,30,22,0.08)]">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageFile}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full py-2.5 px-3 rounded-xl bg-[#F8F3EA] hover:bg-[#F1EADF] border border-[rgba(35,30,22,0.1)] text-[#171512] text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-sm"
            >
              <ImageIcon className="w-4 h-4 text-[#B8A700]" />
              <span>{isEs ? 'Subir captura o foto con QR' : 'Upload photo with QR'}</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
