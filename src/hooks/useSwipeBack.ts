'use client';

import { useEffect, useRef } from 'react';
import { usePartyStore } from '@/store/usePartyStore';

/**
 * Mobile Edge-Swipe-to-Go-Back Hook
 *
 * Implements native iOS/Android style edge swipe:
 * - Initiates only when swipe starts near the left edge (clientX <= 38px)
 * - Requires horizontal intent (dx > 70px, |dy| < 55px)
 * - Vibrates slightly with haptic feedback on completion
 * - Synchronizes with browser popstate history for native back gestures
 */
export function useSwipeBack() {
  const { currentView, activeTab, goBack } = usePartyStore();

  const startXRef = useRef<number | null>(null);
  const startYRef = useRef<number | null>(null);
  const isEligibleRef = useRef<boolean>(false);

  useEffect(() => {
    // Only enable back gesture if there is somewhere to go back to
    const canGoBack =
      currentView !== 'splash' &&
      (currentView !== 'home' || activeTab !== 'home');

    if (!canGoBack) return;

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length !== 1) return;
      const touch = e.touches[0];

      // Edge zone: left 38px of the screen
      if (touch.clientX <= 38) {
        // Prevent triggering while typing in inputs or textareas
        const target = e.target as HTMLElement;
        const tagName = target?.tagName?.toLowerCase();
        if (tagName === 'input' || tagName === 'textarea' || target?.isContentEditable) {
          isEligibleRef.current = false;
          return;
        }

        // Avoid triggering inside open crop modals or sliders
        if (target?.closest('[data-disable-swipe-back]')) {
          isEligibleRef.current = false;
          return;
        }

        startXRef.current = touch.clientX;
        startYRef.current = touch.clientY;
        isEligibleRef.current = true;
      } else {
        isEligibleRef.current = false;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isEligibleRef.current || startXRef.current === null || startYRef.current === null) return;
      const touch = e.touches[0];
      const dx = touch.clientX - startXRef.current;
      const dy = Math.abs(touch.clientY - startYRef.current);

      // If vertical scroll dominates early, cancel horizontal back swipe
      if (dy > dx && dy > 25) {
        isEligibleRef.current = false;
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (!isEligibleRef.current || startXRef.current === null || startYRef.current === null) {
        isEligibleRef.current = false;
        startXRef.current = null;
        startYRef.current = null;
        return;
      }

      const touch = e.changedTouches[0];
      const dx = touch.clientX - startXRef.current;
      const dy = Math.abs(touch.clientY - startYRef.current);

      // Swipe threshold: 70px to the right with bounded vertical drift
      if (dx >= 70 && dy <= 65) {
        try {
          if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
            navigator.vibrate(12);
          }
        } catch {
          // Haptics optional
        }
        goBack();
      }

      isEligibleRef.current = false;
      startXRef.current = null;
      startYRef.current = null;
    };

    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    window.addEventListener('touchend', handleTouchEnd, { passive: true });
    window.addEventListener('touchcancel', handleTouchEnd, { passive: true });

    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
      window.removeEventListener('touchcancel', handleTouchEnd);
    };
  }, [currentView, activeTab, goBack]);

  // Sync state machine with native browser popstate
  useEffect(() => {
    const handlePopState = () => {
      goBack();
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [goBack]);
}
