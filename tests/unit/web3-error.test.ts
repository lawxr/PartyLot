import { describe, it, expect } from 'vitest';
import { formatWeb3Error } from '@/lib/web3Error';

describe('formatWeb3Error', () => {
  it('correctly classifies real MetaMask/Viem user rejection dump', () => {
    const rawViemRejection = new Error(
      `User rejected the request. Request Arguments: from: 0x0419F23541408EEcab6EC4Bd96a454EE8A1dD1BE to: 0x838ef69f8904af767e3ec8d04737417106225e6a value: 0.5 ETH data: 0xb214faa57efc8dfb311d4ab809a92f6fbca3ba7125fff888099dfa12ea gas: 350000 Contract Call: address: 0x838ef69f8904af767e3ec8d04737417106225e6a function: deposit(bytes32 partyId) args: (0x7efc8dfb311d4ab809a92f6fbca3ba7125fff888099dfa12ea0832a0c sender: 0x0419F23541408EEcab6EC4Bd96a454EE8A1dD1BE Docs: https://viem.sh/docs/contract/writeContract Details: MetaMask Tx Signature: User denied transaction signature. Version: viem@2.56.8`
    );

    const resultEs = formatWeb3Error(rawViemRejection, true);
    expect(resultEs.isUserRejection).toBe(true);
    expect(resultEs.title).toBe('Firma cancelada');
    expect(resultEs.message).toContain('Cancelaste la solicitud en tu billetera');
    expect(resultEs.technicalDetails).toBe(rawViemRejection.message);

    const resultEn = formatWeb3Error(rawViemRejection, false);
    expect(resultEn.isUserRejection).toBe(true);
    expect(resultEn.title).toBe('Signature Cancelled');
    expect(resultEn.message).toContain('You cancelled the request in your wallet');
  });

  it('classifies EIP-1193 4001 error code as user rejection', () => {
    const errorWithCode = {
      code: 4001,
      message: 'Rejected',
    };

    const res = formatWeb3Error(errorWithCode, true);
    expect(res.isUserRejection).toBe(true);
    expect(res.title).toBe('Firma cancelada');
  });

  it('handles insufficient funds error cleanly without leaking hex calldata', () => {
    const error = new Error('The total cost (gas * gas fee + value) of executing this transaction exceeds balance');
    const res = formatWeb3Error(error, true);
    expect(res.isUserRejection).toBe(false);
    expect(res.title).toBe('Saldo insuficiente');
    expect(res.message).toContain('No dispones de suficiente saldo o gas');
  });

  it('handles network timeout and disconnect cleanly', () => {
    const error = new Error('fetch failed due to network offline timeout');
    const res = formatWeb3Error(error, false);
    expect(res.isUserRejection).toBe(false);
    expect(res.title).toBe('Network Connection Error');
    expect(res.message).toContain('Could not connect to the network');
  });

  it('extracts contract revert reason cleanly', () => {
    const revertError = new Error("execution reverted with reason string 'PartyNotRegistered'");
    const res = formatWeb3Error(revertError, true);
    expect(res.isUserRejection).toBe(false);
    expect(res.title).toBe('Transacción rechazada');
    expect(res.message).toBe('Motivo: PartyNotRegistered');
  });

  it('sanitizes unknown errors and strips Viem debug clutter in fallback', () => {
    const diagnosticError = new Error(
      'Execution failed at index 0. Request Arguments: from: 0x123 to: 0x456 Contract Call: foo() Docs: https://viem.sh'
    );
    const res = formatWeb3Error(diagnosticError, false);
    expect(res.isUserRejection).toBe(false);
    expect(res.message).toBe('Execution failed at index 0');
    expect(res.message).not.toContain('Request Arguments');
    expect(res.message).not.toContain('https://viem.sh');
  });

  it('returns already formatted errors intact', () => {
    const formatted = {
      title: 'Custom Title',
      message: 'Custom Message',
      isUserRejection: false,
    };
    const res = formatWeb3Error(formatted, true);
    expect(res).toBe(formatted);
  });
});
