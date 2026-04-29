export interface BlockchainLogEntry {
  action: string;
  role: string;
  txHash: string;
  blockNumber: number;
  gasUsed: string;
  from: string;
  timestamp: string;
}

const MAX_LOGS = 50;

export const blockchainLogs: BlockchainLogEntry[] = [];

export function logBlockchainAction(entry: BlockchainLogEntry): void {
  blockchainLogs.unshift(entry);
  if (blockchainLogs.length > MAX_LOGS) {
    blockchainLogs.length = MAX_LOGS;
  }
}
