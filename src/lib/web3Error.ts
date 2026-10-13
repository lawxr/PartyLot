export interface FormattedWeb3Error {
  title: string;
  message: string;
  isUserRejection: boolean;
  technicalDetails?: string;
}

/**
 * Parses raw Viem/Ethers/MetaMask/Privy error dumps into elegant, human-readable feedback.
 * Prevents internal RPC diagnostic noise, hex calldata, and doc links from leaking to the UI.
 */
export function formatWeb3Error(err: unknown, isEs = true): FormattedWeb3Error {
  if (!err) {
    return {
      title: isEs ? 'Error en la transacción' : 'Transaction Failed',
      message: isEs
        ? 'Ocurrió un error inesperado al procesar la transacción.'
        : 'An unexpected error occurred while processing the transaction.',
      isUserRejection: false,
    };
  }

  // If err is already a FormattedWeb3Error object
  if (
    typeof err === 'object' &&
    err !== null &&
    'title' in err &&
    'message' in err &&
    'isUserRejection' in err
  ) {
    return err as FormattedWeb3Error;
  }

  const errObj = typeof err === 'object' && err !== null ? (err as Record<string, unknown>) : null;
  const rawMsg = err instanceof Error ? err.message : String(err || '');
  const shortMsg = typeof errObj?.shortMessage === 'string' ? errObj.shortMessage : '';
  const details = typeof errObj?.details === 'string' ? errObj.details : '';
  const errName = typeof errObj?.name === 'string' ? errObj.name : '';
  const errCode = errObj?.code ?? (errObj?.cause as Record<string, unknown> | undefined)?.code;

  const combinedSearch = `${errName} ${shortMsg} ${details} ${rawMsg}`.toLowerCase();

  // 1. User Rejection in Wallet (EIP-1193 code 4001, MetaMask, Rabby, Coinbase, Privy, etc.)
  const isRejection =
    errCode === 4001 ||
    errCode === 'ACTION_REJECTED' ||
    errName === 'UserRejectedRequestError' ||
    combinedSearch.includes('user rejected') ||
    combinedSearch.includes('user denied') ||
    combinedSearch.includes('rejected the request') ||
    combinedSearch.includes('denied transaction signature') ||
    combinedSearch.includes('action_rejected') ||
    combinedSearch.includes('user_rejected') ||
    combinedSearch.includes('declined') ||
    combinedSearch.includes('cancelled') ||
    combinedSearch.includes('canceled');

  if (isRejection) {
    return {
      title: isEs ? 'Firma cancelada' : 'Signature Cancelled',
      message: isEs
        ? 'Cancelaste la solicitud en tu billetera. No se debitó ningún fondo.'
        : 'You cancelled the request in your wallet. No funds were debited.',
      isUserRejection: true,
      technicalDetails: rawMsg || details || shortMsg,
    };
  }

  // 2. Insufficient Balance / Funds for gas or value
  const isInsufficientFunds =
    errName === 'InsufficientFundsError' ||
    combinedSearch.includes('insufficient funds') ||
    combinedSearch.includes('exceeds balance') ||
    combinedSearch.includes('gas * price + value') ||
    combinedSearch.includes('gas * gas fee + value') ||
    combinedSearch.includes('insufficient balance') ||
    combinedSearch.includes('intrinsic gas too low');

  if (isInsufficientFunds) {
    return {
      title: isEs ? 'Saldo insuficiente' : 'Insufficient Balance',
      message: isEs
        ? 'No dispones de suficiente saldo o gas en tu billetera para completar esta transacción.'
        : 'Your wallet does not have enough balance or gas to complete this transaction.',
      isUserRejection: false,
      technicalDetails: rawMsg,
    };
  }

  // 3. Network Offline / RPC Timeout / Connection reset
  const isNetworkError =
    combinedSearch.includes('network offline') ||
    combinedSearch.includes('connection reset') ||
    combinedSearch.includes('timeout') ||
    combinedSearch.includes('failed to fetch') ||
    combinedSearch.includes('could not detect network') ||
    combinedSearch.includes('fetch failed') ||
    combinedSearch.includes('network error') ||
    combinedSearch.includes('endpoint request timed out');

  if (isNetworkError) {
    return {
      title: isEs ? 'Error de conexión' : 'Network Connection Error',
      message: isEs
        ? 'No se pudo conectar con la red o el servicio. Revisa tu conexión e inténtalo de nuevo.'
        : 'Could not connect to the network. Please check your connection and try again.',
      isUserRejection: false,
      technicalDetails: rawMsg,
    };
  }

  // 4. Contract Execution Reverted
  const isReverted =
    errName === 'ContractFunctionExecutionError' ||
    errName === 'ContractFunctionRevertedError' ||
    combinedSearch.includes('execution reverted') ||
    combinedSearch.includes('contract call reverted') ||
    combinedSearch.includes('transaction reverted') ||
    combinedSearch.includes('reverted with reason');

  if (isReverted) {
    const match =
      rawMsg.match(/reverted with reason string '([^']+)'/i) ||
      rawMsg.match(/reverted with custom error '([^']+)'/i) ||
      rawMsg.match(/reverted with the following reason:\s*([^\n\r]+)/i);
    const reason = match ? match[1].trim() : undefined;

    return {
      title: isEs ? 'Transacción rechazada' : 'Transaction Reverted',
      message: reason
        ? (isEs ? `Motivo: ${reason}` : `Reason: ${reason}`)
        : (isEs ? 'El contrato inteligente rechazó la operación.' : 'The smart contract reverted the transaction.'),
      isUserRejection: false,
      technicalDetails: rawMsg,
    };
  }

  // 5. Clean Fallback: Strip Viem/RPC diagnostic noise and avoid leaking raw arguments or hex bytes
  let cleanSummary = shortMsg || '';
  if (!cleanSummary) {
    cleanSummary = rawMsg
      .split(/\b(Request Arguments|Contract Call|Docs:|Version:|Details:|sender: 0x)/i)[0]
      .split('\n')[0]
      .replace(/^Error:\s*/i, '')
      .trim();
  }

  // Clean trailing punctuation or colon
  cleanSummary = cleanSummary.replace(/[:.,]+$/, '').trim();

  // If cleanSummary still looks like an unparsed internal diagnostic or hex dump
  if (!cleanSummary || cleanSummary.length < 5 || /0x[a-fA-F0-9]{10,}/.test(cleanSummary)) {
    cleanSummary = isEs
      ? 'Ocurrió un error inesperado al procesar la transacción.'
      : 'An unexpected error occurred while processing the transaction.';
  } else if (cleanSummary.length > 90) {
    cleanSummary = `${cleanSummary.slice(0, 87)}...`;
  }

  return {
    title: isEs ? 'No se pudo procesar la transacción' : 'Transaction Failed',
    message: cleanSummary,
    isUserRejection: false,
    technicalDetails: rawMsg,
  };
}

export { formatShortRelativeTime } from './time';
