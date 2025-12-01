export class ChainMonitor {
  public readonly chainName: string;
  private client: any;
  private watchers: Array<{
    address: string;
    event: any;
    args: any;
    onLogs: (logs: any[]) => Promise<void>;
    name: string;
  }> = [];
  private lastBlock: bigint = 0n;
  private pollingInterval: number;
  private maxBlockRange: bigint;

  constructor(chainName: string, client: any, pollingInterval: number = 20000, maxBlockRange: bigint = 1000n) {
    this.chainName = chainName;
    this.client = client;
    this.pollingInterval = pollingInterval;
    this.maxBlockRange = maxBlockRange;
  }

  public getClient() {
    return this.client;
  }

  addWatcher(address: string, event: any, args: any, onLogs: (logs: any[]) => Promise<void>, name: string) {
    this.watchers.push({ address, event, args, onLogs, name });
  }

  async start() {
    try {
      this.lastBlock = await this.client.getBlockNumber();
      console.log(`[${this.chainName}] Started monitoring from block ${this.lastBlock}`);
      this.loop();
    } catch (e) {
      console.error(`[${this.chainName}] Failed to get initial block number:`, e);
      setTimeout(() => this.start(), this.pollingInterval);
    }
  }

  private async loop() {
    try {
      let currentBlock;
      try {
        currentBlock = await this.client.getBlockNumber();
      } catch (e: any) {
        if (e?.message?.includes('429') || e?.status === 429 || e?.details?.includes('Too Many Requests')) {
            console.warn(`[${this.chainName}] Rate limited (429) fetching block number. Pausing for 30s...`);
            setTimeout(() => this.loop(), 30000);
            return;
        }
        throw e;
      }
      
      // Process blocks in chunks if needed
      while (this.lastBlock < currentBlock) {
        let toBlock = currentBlock;
        if (currentBlock - this.lastBlock > this.maxBlockRange) {
          toBlock = this.lastBlock + this.maxBlockRange;
        }

        // Phase 1: Fetch all logs for this chunk
        const pendingLogs: Array<{ watcher: any, logs: any[] }> = [];
        let fetchFailed = false;

        for (const watcher of this.watchers) {
            try {
                const logs = await this.client.getLogs({
                    address: watcher.address as `0x${string}`,
                    event: watcher.event,
                    args: watcher.args,
                    fromBlock: this.lastBlock + 1n,
                    toBlock: toBlock
                });
                pendingLogs.push({ watcher, logs });
            } catch (e: any) {
                const errorString = JSON.stringify(e, Object.getOwnPropertyNames(e));
                const isBlockRangeError = 
                    e?.message?.includes('block range') || 
                    e?.details?.includes('block range') || 
                    e?.details?.includes('-32600') ||
                    errorString.includes('block range');

                if (isBlockRangeError) {
                    const newRange = this.maxBlockRange / 2n;
                    if (newRange < 1n) {
                         console.error(`[${this.chainName}] Block range too small to reduce further.`);
                         fetchFailed = true;
                    } else {
                        console.warn(`[${this.chainName}] Block range limit hit. Reducing maxBlockRange from ${this.maxBlockRange} to ${newRange}.`);
                        this.maxBlockRange = newRange;
                        fetchFailed = true; // Retry in next loop
                    }
                } else if (e?.message?.includes('429') || e?.status === 429 || e?.details?.includes('Too Many Requests')) {
                    console.warn(`[${this.chainName}] Rate limited (429) polling ${watcher.name}. Pausing for 30s...`);
                    setTimeout(() => this.loop(), 30000);
                    return; 
                } else {
                    console.error(`[${this.chainName}] Error polling ${watcher.name}:`, e.message || e);
                    fetchFailed = true;
                }
                break; 
            }
        }

        if (fetchFailed) {
            break; // Wait for next interval to retry
        }

        // Phase 2: Process logs
        for (const { watcher, logs } of pendingLogs) {
            if (logs.length > 0) {
                await watcher.onLogs(logs);
            }
        }

        this.lastBlock = toBlock;
        
        if (this.lastBlock < currentBlock) {
            await new Promise(r => setTimeout(r, 2000));
        }
      }
    } catch (e) {
      console.error(`[${this.chainName}] Error in poll loop:`, e);
    }

    setTimeout(() => this.loop(), this.pollingInterval);
  }
}
