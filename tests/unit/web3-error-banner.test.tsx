import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { Web3ErrorBanner } from '@/components/ui/Web3ErrorBanner';

describe('Web3ErrorBanner Static Markup Tests', () => {
  it('returns nothing when error is null or undefined', () => {
    const htmlNull = renderToStaticMarkup(<Web3ErrorBanner error={null} />);
    expect(htmlNull).toBe('');

    const htmlUndef = renderToStaticMarkup(<Web3ErrorBanner error={undefined} />);
    expect(htmlUndef).toBe('');
  });

  it('renders amber banner for user rejection without technical details', () => {
    const rejectionError = {
      title: 'Firma cancelada',
      message: 'Cancelaste la solicitud en tu billetera. No se debitó ningún fondo.',
      isUserRejection: true,
      technicalDetails: 'User rejected the request at 0x123',
    };

    const html = renderToStaticMarkup(
      <Web3ErrorBanner error={rejectionError} isEs={true} onDismiss={() => {}} />
    );

    expect(html).toContain('role="alert"');
    expect(html).toContain('bg-amber-500');
    expect(html).toContain('Firma cancelada');
    expect(html).toContain('Cancelaste la solicitud en tu billetera');
    expect(html).toContain('aria-label="Cerrar aviso"');
    // Does NOT render technical details for intentional cancellation
    expect(html).not.toContain('<details');
    expect(html).not.toContain('User rejected the request at 0x123');
  });

  it('renders rose banner with collapsible technical details for real onchain errors', () => {
    const revertError = {
      title: 'Transacción rechazada',
      message: 'Motivo: PartyNotRegistered',
      isUserRejection: false,
      technicalDetails: 'execution reverted with reason string PartyNotRegistered',
    };

    const html = renderToStaticMarkup(
      <Web3ErrorBanner error={revertError} isEs={true} onDismiss={() => {}} />
    );

    expect(html).toContain('role="alert"');
    expect(html).toContain('bg-rose-500');
    expect(html).toContain('Transacción rechazada');
    expect(html).toContain('Motivo: PartyNotRegistered');
    // Technical details accordion rendered
    expect(html).toContain('<details');
    expect(html).toContain('Detalles técnicos');
    expect(html).toContain('PartyNotRegistered');
  });

  it('automatically formats raw Error instances', () => {
    const rawError = new Error('User denied transaction signature in MetaMask');
    const html = renderToStaticMarkup(
      <Web3ErrorBanner error={rawError} isEs={true} />
    );

    expect(html).toContain('Firma cancelada');
    expect(html).toContain('Cancelaste la solicitud en tu billetera');
    expect(html).toContain('bg-amber-500');
  });
});
