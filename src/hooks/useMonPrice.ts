'use client';

import { useState, useEffect, useCallback } from 'react';

export interface MonPriceState {
  price: number;
  formatted: string;
  symbol: string;
  source: string;
  isLoading: boolean;
  error: string | null;
}

const DEFAULT_MON_USD_PRICE = 0.0263;

export function useMonPrice() {
  const [state, setState] = useState<MonPriceState>({
    price: DEFAULT_MON_USD_PRICE,
    formatted: `$${DEFAULT_MON_USD_PRICE.toFixed(4)}`,
    symbol: 'MON/USD',
    source: 'Pyth Oracle (Monad)',
    isLoading: true,
    error: null,
  });

  const fetchPrice = useCallback(async () => {
    try {
      const res = await fetch('/api/oracle/price');
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      const data = await res.json();
      if (data.success && typeof data.price === 'number') {
        setState({
          price: data.price,
          formatted: data.formatted || `$${data.price.toFixed(4)}`,
          symbol: data.symbol || 'MON/USD',
          source: data.source || 'Pyth Network',
          isLoading: false,
          error: null,
        });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error fetching MON price';
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: msg,
      }));
    }
  }, []);

  useEffect(() => {
    let isCancelled = false;

    const loadPrice = async () => {
      try {
        const res = await fetch('/api/oracle/price');
        if (!res.ok) throw new Error(`HTTP error ${res.status}`);
        const data = await res.json();
        if (!isCancelled && data.success && typeof data.price === 'number') {
          setState({
            price: data.price,
            formatted: data.formatted || `$${data.price.toFixed(4)}`,
            symbol: data.symbol || 'MON/USD',
            source: data.source || 'Pyth Network',
            isLoading: false,
            error: null,
          });
        }
      } catch (err: unknown) {
        if (!isCancelled) {
          const msg = err instanceof Error ? err.message : 'Error fetching MON price';
          setState((prev) => ({
            ...prev,
            isLoading: false,
            error: msg,
          }));
        }
      }
    };

    void loadPrice();
    const interval = setInterval(() => {
      void loadPrice();
    }, 30_000);

    return () => {
      isCancelled = true;
      clearInterval(interval);
    };
  }, []);

  const convertToUsd = useCallback(
    (monAmount: number): number => {
      if (isNaN(monAmount) || monAmount <= 0) return 0;
      return monAmount * state.price;
    },
    [state.price]
  );

  const formatUsd = useCallback(
    (monAmount: number, maxDecimals: number = 2): string => {
      const usdValue = convertToUsd(monAmount);
      if (usdValue === 0) return '$0.00';
      if (usdValue < 0.01) {
        return `< $0.01`;
      }
      return `$${usdValue.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: maxDecimals,
      })}`;
    },
    [convertToUsd]
  );

  return {
    ...state,
    refetch: fetchPrice,
    convertToUsd,
    formatUsd,
  };
}
