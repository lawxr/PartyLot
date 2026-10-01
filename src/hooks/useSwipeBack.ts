'use client';

import { useEffect, useRef } from 'react';
import { usePartyStore } from '@/store/usePartyStore';

/**
 * Mobile Edge-Swipe-to-Go-Back Hook
 *
 * Implements native iOS/Android style edge swipe:
 * - Initiates when swipe starts near the left edge (clientX <= 52px)
 * - Requires horizontal intent (dx > 65px, |dy| < 55px)
 * - Renders a smooth visual edge indicator arrow that scales and lights up
 * - Vibrates slightly with haptic feedback on completion
 * - Synchronizes with browser popstate history for native back gestures
 */
export function useSwipeBack() {
  const { currentView, activeTab, goBack } = usePartyStore();

  const startXRef = useRef<number | null>(null);
  const startYRef = useRef<number | null>(null);
  const isEligibleRef = useRef<boolean>(false);
  const indicatorRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // Only enable back gesture if there is somewhere to go back to
    const canGoBack =
      currentView !== 'splash' &&
      (currentView !== 'home' || activeTab !== 'home');

    if (!canGoBack) return;

    // Helper to get or create indicator DOM element
    const getIndicator = () => {
      if (!indicatorRef.current && typeof document !== 'undefined') {
        let el = document.getElementById('edge-swipe-back-pill') as HTMLDivElement | null;
        if (!el) {
          el = document.createElement('div');
          el.id = 'edge-swipe-back-pill';
          el.className =
            'fixed z-50 pointer-events-none transition-all duration-75 flex items-center justify-center rounded-full shadow-lg';
          el.style.display = 'none';
          el.style.left = '0px';
          el.style.width = '42px';
          el.style.height = '42px';
          el.style.backdropFilter = 'blur(12px)';
          el.style.setProperty('-webkit-backdrop-filter', 'blur(12px)');
          el.innerHTML = `
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="15 18 9 12 15 6"></polyline>
            </svg>
          `;
          document.body.appendChild(el);
        }
        indicatorRef.current = el;
      }
      return indicatorRef.current;
    };

    const hideIndicator = () => {
      const el = getIndicator();
      if (el) {
        el.style.transition = 'transform 0.2s ease-out, opacity 0.2s ease-out';
        el.style.transform = 'translate3d(-50px, 0, 0) scale(0.6)';
        el.style.opacity = '0';
        setTimeout(() => {
          if (el) el.style.display = 'none';
        }, 220);
      }
    };

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length !== 1) return;
      const touch = e.touches[0];

      // Edge zone: left 52px of the screen for natural thumb reach
      if (touch.clientX <= 52) {
        // Prevent triggering while typing in inputs or textareas
        const target = e.target as HTMLElement;
        const tagName = target?.tagName?.toLowerCase();
        if (tagName === 'input' || tagName === 'textarea' || target?.isContentEditable) {
          isEligibleRef.current = false;
          return;
        }

        // Avoid triggering inside open crop modals or swipeable game cards
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
        hideIndicator();
        return;
      }

      // Visual edge indicator feedback
      if (dx > 8 && dy < 55) {
        const el = getIndicator();
        if (el) {
          el.style.display = 'flex';
          el.style.top = `${Math.max(60, Math.min(window.innerHeight - 100, (startYRef.current || 200) - 21))}px`;

          const pullDistance = Math.min(dx * 0.42, 36);
          const isPassedThreshold = dx >= 65;

          el.style.transition = 'none';
          el.style.transform = `translate3d(${pullDistance}px, 0, 0) scale(${isPassedThreshold ? 1.15 : 0.85 + Math.min(dx / 200, 0.25)})`;
          el.style.opacity = `${Math.min(dx / 40, 1)}`;

          if (isPassedThreshold) {
            el.style.backgroundColor = '#F0DC00';
            el.style.color = '#171512';
            el.style.border = '2px solid rgba(23, 21, 18, 0.15)';
            el.style.boxShadow = '0 8px 24px rgba(240, 220, 0, 0.45)';
          } else {
            el.style.backgroundColor = 'rgba(255, 253, 248, 0.85)';
            el.style.color = '#171512';
            el.style.border = '1px solid rgba(0, 0, 0, 0.12)';
            el.style.boxShadow = '0 4px 14px rgba(0, 0, 0, 0.1)';
          }
        }
      } else {
        hideIndicator();
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (!isEligibleRef.current || startXRef.current === null || startYRef.current === null) {
        isEligibleRef.current = false;
        startXRef.current = null;
        startYRef.current = null;
        hideIndicator();
        return;
      }

      const touch = e.changedTouches[0];
      const dx = touch.clientX - startXRef.current;
      const dy = Math.abs(touch.clientY - startYRef.current);

      // Swipe threshold: 65px to the right with bounded vertical drift
      if (dx >= 65 && dy <= 55) {
        try {
          if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
            navigator.vibrate(15);
          }
        } catch {
          // Haptics optional
        }
        goBack();
      }

      hideIndicator();
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
      const el = indicatorRef.current || document.getElementById('edge-swipe-back-pill');
      if (el && el.parentNode) {
        el.parentNode.removeChild(el);
      }
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

