export interface FormattedWeb3Error {
  title: string;
  message: string;
  isUserRejection: boolean;
  technicalDetails?: string;
}

/**
 * Parses raw Viem/Ethers/MetaMask/Privy error dumps into elegant, human-readable feedback.
 */
export function formatWeb3Error(err: unknown, isEs = true): FormattedWeb3Error {
  const rawMsg = err instanceof Error ? err.message : String(err || '');
  const lower = rawMsg.toLowerCase();

  // 1. User Rejection in Wallet (MetaMask, Rabby, Coinbase, Privy, Phantom, etc.)
  if (
    lower.includes('user rejected') ||
    lower.includes('user denied') ||
    lower.includes('rejected the request') ||
    lower.includes('denied transaction signature') ||
    lower.includes('action_rejected') ||
    lower.includes('user_rejected') ||
    lower.includes('declined') ||
    lower.includes('cancelled')
  ) {
    return {
      title: isEs ? 'Firma cancelada' : 'Signature Cancelled',
      message: isEs
        ? 'Cancelaste la solicitud en tu billetera. No se debitó ningún fondo.'
        : 'You cancelled the request in your wallet. No funds were debited.',
      isUserRejection: true,
      technicalDetails: rawMsg,
    };
  }

  // 2. Insufficient Balance / Funds
  if (
    lower.includes('insufficient funds') ||
    lower.includes('exceeds balance') ||
    lower.includes('gas * price + value')
  ) {
    return {
      title: isEs ? 'Saldo insuficiente' : 'Insufficient Funds',
      message: isEs
        ? 'No dispones de suficiente saldo o gas en tu billetera para completar esta transacción.'
        : 'Your wallet does not have enough balance or gas to complete this transaction.',
      isUserRejection: false,
      technicalDetails: rawMsg,
    };
  }

  // 3. Network Offline / RPC Timeout
  if (
    lower.includes('network offline') ||
    lower.includes('connection reset') ||
    lower.includes('timeout') ||
    lower.includes('failed to fetch') ||
    lower.includes('could not detect network')
  ) {
    return {
      title: isEs ? 'Error de red' : 'Network Connection Error',
      message: isEs
        ? 'No se pudo conectar con la red de Monad. Verifica tu conexión e inténtalo de nuevo.'
        : 'Could not connect to Monad network. Please check your connection and try again.',
      isUserRejection: false,
      technicalDetails: rawMsg,
    };
  }

  // 4. Contract Execution Reverted
  if (lower.includes('execution reverted') || lower.includes('contract call reverted')) {
    const match = rawMsg.match(/reverted with reason string '([^']+)'/i);
    const reason = match ? match[1] : undefined;
    return {
      title: isEs ? 'Transacción rechazada' : 'Transaction Reverted',
      message: reason
        ? (isEs ? `Motivo: ${reason}` : `Reason: ${reason}`)
        : (isEs ? 'El contrato inteligente rechazó la operación.' : 'The smart contract reverted the transaction.'),
      isUserRejection: false,
      technicalDetails: rawMsg,
    };
  }

  // 5. Clean Fallback (strip viem noise and long stack dumps)
  const firstLine = rawMsg.split('\n')[0].replace(/^Error:\s*/i, '').trim();
  const cleanSummary = firstLine.length > 90 ? `${firstLine.slice(0, 87)}...` : firstLine;

  return {
    title: isEs ? 'No se pudo procesar la transacción' : 'Transaction Failed',
    message: cleanSummary || (isEs ? 'Ocurrió un error inesperado al interactuar con el contrato onchain.' : 'An unexpected error occurred while interacting with the onchain contract.'),
    isUserRejection: false,
    technicalDetails: rawMsg,
  };
}

/**
 * Formats timestamps into compact relative times matching iOS/social standards (e.g., '2m ago', '1h ago').
 */
export function formatShortRelativeTime(timestamp?: string | number): string {
  if (!timestamp) return '2m ago';
  const str = String(timestamp).trim();
  if (str === 'Just now') return '1m ago';
  if (/^\d+[mhd]\s*(ago)?$/i.test(str)) return str;

  const date = new Date(str);
  if (isNaN(date.getTime())) return str.slice(0, 10);

  const now = Date.now();
  const diffSec = Math.max(0, Math.floor((now - date.getTime()) / 1000));

  if (diffSec < 60) return '1m ago';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return `${Math.floor(diffDays / 7)}w ago`;
}
