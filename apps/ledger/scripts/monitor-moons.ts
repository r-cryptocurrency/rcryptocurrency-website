import { createPublicClient, http, parseAbiItem, formatUnits } from 'viem';
import { arbitrum, mainnet } from 'viem/chains';
import { MOON_CONTRACTS } from '@rcryptocurrency/chain-data';
import * as dotenv from 'dotenv';
import * as path from 'path';


// Load .env from project root
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

// Import prisma after dotenv to ensure DATABASE_URL is loaded
const { prisma } = require('@rcryptocurrency/database');

// Define Arbitrum Nova manually as it is not exported by this version of viem
const arbitrumNova = {
  id: 42170,
  name: 'Arbitrum Nova',
  network: 'arbitrum-nova',
  nativeCurrency: {
    name: 'Ether',
    symbol: 'ETH',
    decimals: 18,
  },
  rpcUrls: {
    default: { http: ['https://nova.arbitrum.io/rpc'] },
    public: { http: ['https://nova.arbitrum.io/rpc'] },
  },
  contracts: {
    multicall3: {
      address: '0xcA11bde05977b3631167028862bE2a173976CA11',
      blockCreated: 1746963,
    },
  },
} as const;

const BURN_ADDRESS = '0x000000000000000000000000000000000000dead';
const TELEGRAM_API = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}`;
const CHANNEL_ID = process.env.TELEGRAM_CHANNEL_ID || '@rCryptoCurrencyOfficial';
const NOTIFICATION_THRESHOLD = parseFloat(process.env.MOON_NOTIFICATION_THRESHOLD || '0.5');

// --- Event Definitions ---
const TRANSFER_EVENT = parseAbiItem('event Transfer(address indexed from, address indexed to, uint256 value)');

// SushiSwap V2: Swap(address sender, uint256 amount0In, uint256 amount1In, uint256 amount0Out, uint256 amount1Out, address to)
const SWAP_V2_EVENT = parseAbiItem('event Swap(address indexed sender, uint256 amount0In, uint256 amount1In, uint256 amount0Out, uint256 amount1Out, address indexed to)');

// Uniswap V3 / Camelot V3: Swap(address sender, address recipient, int256 amount0, int256 amount1, uint160 sqrtPriceX96, uint128 liquidity, int24 tick)
const SWAP_V3_EVENT = parseAbiItem('event Swap(address indexed sender, address indexed recipient, int256 amount0, int256 amount1, uint160 sqrtPriceX96, uint128 liquidity, int24 tick)');

// Uniswap V4: Swap(bytes32 indexed id, address indexed sender, int128 amount0, int128 amount1, uint160 sqrtPriceX96, uint128 liquidity, int24 tick, uint24 fee)
// Note: V4 events are emitted by the PoolManager, not the pool itself.
const SWAP_V4_EVENT = parseAbiItem('event Swap(bytes32 indexed id, address indexed sender, int128 amount0, int128 amount1, uint160 sqrtPriceX96, uint128 liquidity, int24 tick, uint24 fee)');

// --- Pool Configurations ---
const POOLS = {
  NOVA_SUSHI_V2: {
    address: '0xd6c821b282531868721b41badca1f1ce471f43c5',
    type: 'V2',
    name: 'SushiSwap V2 (Nova)',
    token0: { symbol: 'MOON', decimals: 18 },
    token1: { symbol: 'ETH', decimals: 18 }
  },
  ONE_CAMELOT_V3: {
    address: '0x5e27a422ec06a57567a843fd65a1bbb06ac19fc0',
    type: 'V3',
    name: 'Camelot V3 (One)',
    token0: { symbol: 'MOON', decimals: 18 },
    token1: { symbol: 'ETH', decimals: 18 }
  },
  ONE_UNI_V3: {
    address: '0x285b461B3d233ab24C665E9FbAF5B96352E3ED07',
    type: 'V3',
    name: 'Uniswap V3 (One)',
    token0: { symbol: 'MOON', decimals: 18 },
    token1: { symbol: 'USDC', decimals: 6 }
  },
  // V4 Pools are identified by ID, but we need the PoolManager address.
  // Retrieved from Universal Router (0xA51...) on Arbitrum One.
  ONE_POOL_MANAGER: {
    address: '0x360E68faCcca8cA495c1B759Fd9EEe466db9FB32',
    type: 'V4_MANAGER',
    name: 'Uniswap V4 Manager (One)',
    pools: {
        '0x065144c11d71d908594e6305b7ae834d00443374f87cc82692fbac8ed81af56a': {
            pair: 'MOON/USDC',
            token0: { symbol: 'MOON', decimals: 18 },
            token1: { symbol: 'USDC', decimals: 6 }
        },
        '0xa14aaa23a3b1ae4b0bdc031151c6814f1d06a901ffc5f8ab6951c75de2bc2c17': {
            pair: 'MOON/ETH',
            token0: { symbol: 'MOON', decimals: 18 },
            token1: { symbol: 'ETH', decimals: 18 }
        }
    }
  }
};

async function sendTelegramMessage(message: string) {
  if (!process.env.TELEGRAM_BOT_TOKEN) {
    console.warn('TELEGRAM_BOT_TOKEN not set, skipping notification.');
    return;
  }

  try {
    const response = await fetch(`${TELEGRAM_API}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: CHANNEL_ID,
        text: message,
        parse_mode: 'Markdown',
        disable_web_page_preview: true
      })
    });

    const data = await response.json();
    if (!data.ok) {
      console.error('Telegram API Error:', data);
    } else {
      console.log('Notification sent to Telegram.');
    }
  } catch (e) {
    console.error('Failed to send Telegram message:', e);
  }
}

function setupBurnWatcher(
  chainName: string, 
  client: any, 
  contractAddress: string, 
  explorerBaseUrl: string
) {
  console.log(`   - Watching Burns on ${chainName}...`);
  
  client.watchEvent({
    address: contractAddress as `0x${string}`,
    event: TRANSFER_EVENT,
    args: {
      to: BURN_ADDRESS as `0x${string}`
    },
    onLogs: async (logs: any[]) => {
      for (const log of logs) {
        const { from, value } = log.args;
        const hash = log.transactionHash;
        
        if (from && value) {
          const amount = parseFloat(formatUnits(value, 18));
          
          if (amount < NOTIFICATION_THRESHOLD) {
             console.log(`   [${chainName}] Burn detected but below threshold: ${amount.toFixed(2)} MOONs`);
             continue;
          }

          const amountFormatted = amount.toLocaleString(undefined, { maximumFractionDigits: 2 });
          
          console.log(`🔥 [${chainName}] BURN DETECTED: ${amountFormatted} MOONs from ${from}`);

          try {
            await prisma.burn.create({
              data: {
                txHash: hash,
                blockNumber: log.blockNumber || 0n,
                amount: amount,
                chain: chainName,
                sender: from,
              }
            });
            console.log('   -> Saved to DB');
          } catch (e) {
            console.error('   -> Failed to save burn to DB:', e);
          }

          const explorerLink = `${explorerBaseUrl}/tx/${hash}`;
          const message = `🔥 *BURN ALERT!* (${chainName}) 🔥\n\n` +
            `*${amountFormatted} MOONs* were just burned!\n\n` +
            `From: \`${from}\`\n` +
            `[View Transaction](${explorerLink})`;

          await sendTelegramMessage(message);
        }
      }
    },
    onError: (error: any) => {
      console.error(`Error watching burns on ${chainName}:`, error);
    }
  });
}

function setupSwapWatcher(
  chainName: string,
  client: any,
  poolConfig: any,
  explorerBaseUrl: string
) {
  console.log(`   - Watching Swap Pool: ${poolConfig.name}...`);

  if (poolConfig.type === 'V2') {
    client.watchEvent({
      address: poolConfig.address as `0x${string}`,
      event: SWAP_V2_EVENT,
      onLogs: async (logs: any[]) => {
        for (const log of logs) {
          const { amount0In, amount1In, amount0Out, amount1Out } = log.args;
          
          const dec0 = poolConfig.token0?.decimals || 18;
          const dec1 = poolConfig.token1?.decimals || 18;
          const sym0 = poolConfig.token0?.symbol || 'T0';
          const sym1 = poolConfig.token1?.symbol || 'T1';

          // Normalize
          const a0In = Number(formatUnits(amount0In, dec0));
          const a1In = Number(formatUnits(amount1In, dec1));
          const a0Out = Number(formatUnits(amount0Out, dec0));
          const a1Out = Number(formatUnits(amount1Out, dec1));

          // Calculate total volume for this swap
          const vol0 = a0In + a0Out;
          const vol1 = a1In + a1Out;

          // Identify MOON
          const isMoon0 = sym0 === 'MOON';
          let moonAmount = isMoon0 ? vol0 : vol1;
          let quoteAmount = isMoon0 ? vol1 : vol0;
          let quoteSym = isMoon0 ? sym1 : sym0;

          // Check threshold
          if (moonAmount > NOTIFICATION_THRESHOLD) {
             const hash = log.transactionHash;
             const price = quoteAmount / moonAmount;
             
             // Determine Action: If MOON was IN, it's a SELL. If MOON was OUT, it's a BUY.
             let action = 'SWAP';
             if (isMoon0) {
                 if (a0In > 0) action = '🔴 SOLD';
                 else action = '🟢 BOUGHT';
             } else {
                 if (a1In > 0) action = '🔴 SOLD';
                 else action = '🟢 BOUGHT';
             }

             console.log(`🔄 [${poolConfig.name}] ${action} ${moonAmount.toFixed(2)} MOON @ ${price.toFixed(6)} ${quoteSym}`);
             
             try {
                // Determine direction for DB
                let dbTokenIn = '', dbTokenOut = '', dbAmountIn = 0, dbAmountOut = 0;
                if (a0In > 0) {
                    dbTokenIn = sym0; dbAmountIn = a0In;
                    dbTokenOut = sym1; dbAmountOut = a1Out;
                } else {
                    dbTokenIn = sym1; dbAmountIn = a1In;
                    dbTokenOut = sym0; dbAmountOut = a0Out;
                }

                await prisma.swap.create({
                    data: {
                        txHash: hash,
                        blockNumber: log.blockNumber || 0n,
                        chain: chainName,
                        dex: poolConfig.name,
                        amountIn: dbAmountIn,
                        amountOut: dbAmountOut,
                        tokenIn: dbTokenIn,
                        tokenOut: dbTokenOut,
                        maker: log.args.sender || '0x',
                    }
                });
                console.log('   -> Saved to DB');
             } catch (e) {
                console.error('   -> Failed to save swap to DB:', e);
             }
             
             const explorerLink = `${explorerBaseUrl}/tx/${hash}`;
             const message = `🔄 *SWAP ALERT!* (${poolConfig.name})\n\n` +
               `**${action}** *${moonAmount.toLocaleString(undefined, {maximumFractionDigits: 2})} MOON*\n` +
               `For: ${quoteAmount.toLocaleString(undefined, {maximumFractionDigits: 6})} ${quoteSym}\n` +
               `Price: ${price.toFixed(6)} ${quoteSym}\n` +
               `[View Transaction](${explorerLink})`;
             
             await sendTelegramMessage(message);
          }
        }
      }
    });
  } else if (poolConfig.type === 'V3') {
    client.watchEvent({
      address: poolConfig.address as `0x${string}`,
      event: SWAP_V3_EVENT,
      onLogs: async (logs: any[]) => {
        for (const log of logs) {
           const { amount0, amount1 } = log.args;
           const hash = log.transactionHash;
           
           const dec0 = poolConfig.token0?.decimals || 18;
           const dec1 = poolConfig.token1?.decimals || 18;
           const sym0 = poolConfig.token0?.symbol || 'T0';
           const sym1 = poolConfig.token1?.symbol || 'T1';

           // V3 amounts are delta. Positive = In, Negative = Out.
           const raw0 = Number(formatUnits(amount0, dec0));
           const raw1 = Number(formatUnits(amount1, dec1));
           
           const abs0 = Math.abs(raw0);
           const abs1 = Math.abs(raw1);
           
           // Identify MOON
           const isMoon0 = sym0 === 'MOON';
           let moonAmount = isMoon0 ? abs0 : abs1;
           let quoteAmount = isMoon0 ? abs1 : abs0;
           let quoteSym = isMoon0 ? sym1 : sym0;

           if (moonAmount > NOTIFICATION_THRESHOLD) {
              const price = quoteAmount / moonAmount;
              
              // Determine Action
              // If MOON (token0) is positive -> User SOLD (paid to pool)
              // If MOON (token0) is negative -> User BOUGHT (received from pool)
              let action = 'SWAP';
              if (isMoon0) {
                  if (raw0 > 0) action = '🔴 SOLD';
                  else action = '🟢 BOUGHT';
              } else {
                  if (raw1 > 0) action = '🔴 SOLD';
                  else action = '🟢 BOUGHT';
              }

              console.log(`🔄 [${poolConfig.name}] ${action} ${moonAmount.toFixed(2)} MOON @ ${price.toFixed(6)} ${quoteSym}`);
              
              try {
                 // V3: Positive amount0 means user is SELLING token0 (paying it in).
                 // Negative amount0 means user is BUYING token0 (taking it out).
                 let dbTokenIn = '', dbTokenOut = '', dbAmountIn = 0, dbAmountOut = 0;
                 
                 if (raw0 > 0) {
                     // User sold token0 for token1
                     dbTokenIn = sym0; dbAmountIn = abs0;
                     dbTokenOut = sym1; dbAmountOut = abs1;
                 } else {
                     // User sold token1 for token0
                     dbTokenIn = sym1; dbAmountIn = abs1;
                     dbTokenOut = sym0; dbAmountOut = abs0;
                 }

                 await prisma.swap.create({
                    data: {
                        txHash: hash,
                        blockNumber: log.blockNumber || 0n,
                        chain: chainName,
                        dex: poolConfig.name,
                        amountIn: dbAmountIn,
                        amountOut: dbAmountOut,
                        tokenIn: dbTokenIn,
                        tokenOut: dbTokenOut,
                        maker: log.args.sender || '0x',
                    }
                 });
                 console.log('   -> Saved to DB');
              } catch (e) {
                 console.error('   -> Failed to save swap to DB:', e);
              }

              const explorerLink = `${explorerBaseUrl}/tx/${hash}`;
              const message = `🔄 *SWAP ALERT!* (${poolConfig.name})\n\n` +
                `**${action}** *${moonAmount.toLocaleString(undefined, {maximumFractionDigits: 2})} MOON*\n` +
                `For: ${quoteAmount.toLocaleString(undefined, {maximumFractionDigits: 6})} ${quoteSym}\n` +
                `Price: ${price.toFixed(6)} ${quoteSym}\n` +
                `[View Transaction](${explorerLink})`;
                
              await sendTelegramMessage(message);
           }
        }
      }
    });
  } else if (poolConfig.type === 'V4_MANAGER') {
     // Watch PoolManager for specific Pool IDs
     client.watchEvent({
      address: poolConfig.address as `0x${string}`,
      event: SWAP_V4_EVENT,
      args: {
          id: Object.keys(poolConfig.pools) // Filter by our pool IDs
      },
      onLogs: async (logs: any[]) => {
        for (const log of logs) {
           const { id, amount0, amount1 } = log.args;
           const hash = log.transactionHash;
           const poolInfo = poolConfig.pools[id];
           
           if (!poolInfo) continue;

           // V4 Semantics:
           // amount0 > 0: User SELLS token0 (Pays to pool)
           // amount0 < 0: User BUYS token0 (Receives from pool)
           
           const rawAmount0 = Number(amount0);
           const rawAmount1 = Number(amount1);
           
           const absAmount0 = Math.abs(rawAmount0) / (10 ** poolInfo.token0.decimals);
           const absAmount1 = Math.abs(rawAmount1) / (10 ** poolInfo.token1.decimals);
           
           // Check threshold on MOONs (token0)
           if (absAmount0 < NOTIFICATION_THRESHOLD) {
               console.log(`   [V4] Swap below threshold: ${absAmount0.toFixed(2)} MOONs`);
               continue;
           }

           const action = rawAmount0 < 0 ? '🟢 BOUGHT' : '🔴 SOLD';
           const price = absAmount1 / absAmount0;
           
           console.log(`🔄 [${poolConfig.name}] V4 Swap: ${action} ${absAmount0.toFixed(2)} MOON @ ${price.toFixed(6)} ${poolInfo.token1.symbol}`);
           
           try {
               // V4: amount0 > 0: User SELLS token0 (Pays to pool)
               let dbTokenIn = '', dbTokenOut = '', dbAmountIn = 0, dbAmountOut = 0;
               
               if (rawAmount0 > 0) {
                   dbTokenIn = poolInfo.token0.symbol; dbAmountIn = absAmount0;
                   dbTokenOut = poolInfo.token1.symbol; dbAmountOut = absAmount1;
               } else {
                   dbTokenIn = poolInfo.token1.symbol; dbAmountIn = absAmount1;
                   dbTokenOut = poolInfo.token0.symbol; dbAmountOut = absAmount0;
               }

               await prisma.swap.create({
                   data: {
                       txHash: hash,
                       blockNumber: log.blockNumber || 0n,
                       chain: chainName,
                       dex: poolConfig.name,
                       amountIn: dbAmountIn,
                       amountOut: dbAmountOut,
                       tokenIn: dbTokenIn,
                       tokenOut: dbTokenOut,
                       maker: log.args.sender || '0x',
                   }
               });
               console.log('   -> Saved to DB');
           } catch (e) {
               console.error('   -> Failed to save swap to DB:', e);
           }

           const explorerLink = `${explorerBaseUrl}/tx/${hash}`;
           const message = `🔄 *V4 SWAP ALERT!* (${poolInfo.pair})\n\n` +
             `**${action}** *${absAmount0.toLocaleString(undefined, {maximumFractionDigits: 2})} MOON*\n` +
             `For: ${absAmount1.toLocaleString(undefined, {maximumFractionDigits: 6})} ${poolInfo.token1.symbol}\n` +
             `Price: ${price.toFixed(6)} ${poolInfo.token1.symbol}\n` +
             `[View Transaction](${explorerLink})`;
             
           await sendTelegramMessage(message);
        }
      }
    });
  }
}

async function main() {
  console.log(`🔥 Starting Moon Monitor (Burns & Swaps)...`);
  console.log(`📢 Notifications > ${NOTIFICATION_THRESHOLD} MOONs to ${CHANNEL_ID}`);

  // Arbitrum Nova
  const novaClient = createPublicClient({
    chain: arbitrumNova,
    transport: http(process.env.RPC_URL_NOVA || "https://nova.arbitrum.io/rpc"),
    pollingInterval: 10_000,
  });
  setupBurnWatcher('Arbitrum Nova', novaClient, MOON_CONTRACTS.arbitrumNova, 'https://nova.arbiscan.io');
  setupSwapWatcher('Arbitrum Nova', novaClient, POOLS.NOVA_SUSHI_V2, 'https://nova.arbiscan.io');

  // Arbitrum One
  const oneClient = createPublicClient({
    chain: arbitrum,
    transport: http(process.env.RPC_URL_ONE || "https://arb1.arbitrum.io/rpc"),
    pollingInterval: 10_000,
  });
  setupBurnWatcher('Arbitrum One', oneClient, MOON_CONTRACTS.arbitrumOne, 'https://arbiscan.io');
  setupSwapWatcher('Arbitrum One', oneClient, POOLS.ONE_CAMELOT_V3, 'https://arbiscan.io');
  setupSwapWatcher('Arbitrum One', oneClient, POOLS.ONE_UNI_V3, 'https://arbiscan.io');
  setupSwapWatcher('Arbitrum One', oneClient, POOLS.ONE_POOL_MANAGER, 'https://arbiscan.io');

  // Ethereum Mainnet
  const ethClient = createPublicClient({
    chain: mainnet,
    transport: http(process.env.RPC_URL_ETH || "https://eth.llamarpc.com"),
    pollingInterval: 60_000,
  });
  setupBurnWatcher('Ethereum', ethClient, MOON_CONTRACTS.ethereum, 'https://etherscan.io');
  
  // Keep process alive
  process.stdin.resume();
}

main().catch(console.error);
