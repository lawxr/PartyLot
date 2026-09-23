export interface SmartAccountSession {
  address: string;
  isDeployed: boolean;
  authMethod: 'apple' | 'google' | 'email' | 'passkey';
  emailOrIdentifier: string;
  sponsoredGas: boolean;
  createdAt: number;
}

export interface EIP712InvitePermit {
  guest: string;
  partyId: number;
  deadline: number;
  nonce: number;
  signature: string;
}

export interface UserOperationReceipt {
  userOpHash: string;
  transactionHash: string;
  success: boolean;
  sponsored: boolean;
  gasSavedMon: string;
  blockNumber: number;
  timestamp: number;
}

export interface TenderlySimulationResult {
  simulationId: string;
  status: boolean;
  gasUsed: number;
  stateDiffCount: number;
  logsCount: number;
  callTrace: string;
}

export interface EnvioEventSync {
  indexerStatus: 'healthy' | 'syncing' | 'lagging';
  latestIndexedBlock: number;
  eventsProcessed: number;
  lastSyncTime: string;
}
