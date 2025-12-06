import { formatUnits } from 'viem';
import { ChainMonitor } from './chain-monitor';
import { 
  TRANSFER_EVENT, 
  SWAP_V2_EVENT, 
  SWAP_V3_EVENT, 
  SWAP_V4_EVENT, 
  BURN_ADDRESS, 
  NOTIFICATION_THRESHOLD 
} from './config';
import { prisma, resolveAddress } from './db';
import { sendTelegramMessage } from './telegram';

export function setupBurnWatcher(
  monitor: ChainMonitor, 
  contractAddress: string, 
  explorerBaseUrl: string
) {
  console.log(`   - Adding Burn Watcher for ${monitor.chainName}...`);
  
  monitor.addWatcher(
    contractAddress,
    TRANSFER_EVENT,
    { to: BURN_ADDRESS as `0x${string}` },
    async (logs: any[]) => {
      for (const log of logs) {
        const { from, value } = log.args;
        const hash = log.transactionHash;
        
        if (from && value) {
          const amount = parseFloat(formatUnits(value, 18));
          
          if (amount < NOTIFICATION_THRESHOLD) {
             continue;
          }

          const amountFormatted = amount.toLocaleString(undefined, { maximumFractionDigits: 2 });
          
          console.log(`🔥 [${monitor.chainName}] BURN DETECTED: ${amountFormatted} MOONs from ${from}`);

          try {
            await prisma.burn.upsert({
              where: { txHash: hash },
              create: {
                txHash: hash,
                blockNumber: log.blockNumber || 0n,
                amount: amount,
                chain: monitor.chainName,
                sender: from,
              },
              update: {
                blockNumber: log.blockNumber || 0n,
                amount: amount,
                chain: monitor.chainName,
                sender: from,
              }
            });
            console.log('   -> Saved to DB');
          } catch (e) {
            console.error('   -> Failed to save burn to DB:', e);
          }

          const fromResolved = await resolveAddress(from);
          const explorerLink = `${explorerBaseUrl}/tx/${hash}`;
          const message = `🔥 *BURN ALERT!* (${monitor.chainName}) 🔥\n\n` +
            `*${amountFormatted} MOONs* were just burned!\n\n` +
            `From: ${fromResolved}\n` +
            `[View Transaction](${explorerLink})`;

          await sendTelegramMessage(message);
        }
      }
    },
    'Burn Watcher'
  );
}

export function setupSwapWatcher(
  monitor: ChainMonitor,
  poolConfig: any,
  explorerBaseUrl: string
) {
  console.log(`   - Adding Swap Watcher: ${poolConfig.name}...`);

  if (poolConfig.type === 'V2') {
    monitor.addWatcher(
      poolConfig.address,
      SWAP_V2_EVENT,
      {},
      async (logs: any[]) => {
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

          // Fetch transaction to get real sender (initiator)
          let maker = log.args.sender || '0x';
          try {
             const tx = await monitor.getClient().getTransaction({ hash: log.transactionHash });
             if (tx && tx.from) maker = tx.from;
          } catch (e) {
             console.warn(`   -> Failed to fetch tx ${log.transactionHash} for sender resolution`);
          }

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

                await prisma.swap.upsert({
                    where: { txHash: hash },
                    create: {
                        txHash: hash,
                        blockNumber: log.blockNumber || 0n,
                        chain: monitor.chainName,
                        dex: poolConfig.name,
                        amountIn: dbAmountIn,
                        amountOut: dbAmountOut,
                        tokenIn: dbTokenIn,
                        tokenOut: dbTokenOut,
                        maker: maker,
                    },
                    update: {
                        blockNumber: log.blockNumber || 0n,
                        chain: monitor.chainName,
                        dex: poolConfig.name,
                        amountIn: dbAmountIn,
                        amountOut: dbAmountOut,
                        tokenIn: dbTokenIn,
                        tokenOut: dbTokenOut,
                        maker: maker,
                    }
                });

                // Update maker's last active timestamp
                await prisma.holder.upsert({
                    where: { address: maker },
                    update: { lastTransferAt: new Date() },
                    create: { address: maker, lastTransferAt: new Date() }
                });

                console.log('   -> Saved to DB');
             } catch (e) {
                console.error('   -> Failed to save swap to DB:', e);
             }
             
             const userResolved = await resolveAddress(maker);
             const explorerLink = `${explorerBaseUrl}/tx/${hash}`;
             const message = `🔄 *SWAP ALERT!* (${poolConfig.name})\n\n` +
               `${userResolved} **${action}** *${moonAmount.toLocaleString(undefined, {maximumFractionDigits: 2})} MOON*\n` +
               `For: ${quoteAmount.toLocaleString(undefined, {maximumFractionDigits: 6})} ${quoteSym}\n` +
               `Price: ${price.toFixed(6)} ${quoteSym}\n` +
               `[View Transaction](${explorerLink})`;
             
             await sendTelegramMessage(message);
          }
        }
      },
      poolConfig.name
    );
  } else if (poolConfig.type === 'V3') {
    monitor.addWatcher(
      poolConfig.address,
      SWAP_V3_EVENT,
      {},
      async (logs: any[]) => {
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
           
           // Fetch transaction to get real sender (initiator)
           let maker = log.args.sender || '0x';
           try {
              const tx = await monitor.getClient().getTransaction({ hash: log.transactionHash });
              if (tx && tx.from) maker = tx.from;
           } catch (e) {
              console.warn(`   -> Failed to fetch tx ${log.transactionHash} for sender resolution`);
           }

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

                 await prisma.swap.upsert({
                    where: { txHash: hash },
                    create: {
                        txHash: hash,
                        blockNumber: log.blockNumber || 0n,
                        chain: monitor.chainName,
                        dex: poolConfig.name,
                        amountIn: dbAmountIn,
                        amountOut: dbAmountOut,
                        tokenIn: dbTokenIn,
                        tokenOut: dbTokenOut,
                        maker: maker,
                    },
                    update: {
                        blockNumber: log.blockNumber || 0n,
                        chain: monitor.chainName,
                        dex: poolConfig.name,
                        amountIn: dbAmountIn,
                        amountOut: dbAmountOut,
                        tokenIn: dbTokenIn,
                        tokenOut: dbTokenOut,
                        maker: maker,
                    }
                 });
                 console.log('   -> Saved to DB');
              } catch (e) {
                 console.error('   -> Failed to save swap to DB:', e);
              }

              const userResolved = await resolveAddress(maker);
              const explorerLink = `${explorerBaseUrl}/tx/${hash}`;
              const message = `🔄 *SWAP ALERT!* (${poolConfig.name})\n\n` +
                `${userResolved} **${action}** *${moonAmount.toLocaleString(undefined, {maximumFractionDigits: 2})} MOON*\n` +
                `For: ${quoteAmount.toLocaleString(undefined, {maximumFractionDigits: 6})} ${quoteSym}\n` +
                `Price: ${price.toFixed(6)} ${quoteSym}\n` +
                `[View Transaction](${explorerLink})`;
                
              await sendTelegramMessage(message);
           }
        }
      },
      poolConfig.name
    );
  } else if (poolConfig.type === 'V4_MANAGER') {
     // Watch PoolManager for specific Pool IDs
     monitor.addWatcher(
      poolConfig.address,
      SWAP_V4_EVENT,
      { id: Object.keys(poolConfig.pools) },
      async (logs: any[]) => {
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

           // Fetch transaction to get real sender (initiator)
           let maker = log.args.sender || '0x';
           try {
              const tx = await monitor.getClient().getTransaction({ hash: log.transactionHash });
              if (tx && tx.from) maker = tx.from;
           } catch (e) {
              console.warn(`   -> Failed to fetch tx ${log.transactionHash} for sender resolution`);
           }
           
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

               await prisma.swap.upsert({
                   where: { txHash: hash },
                   create: {
                       txHash: hash,
                       blockNumber: log.blockNumber || 0n,
                       chain: monitor.chainName,
                       dex: poolConfig.name,
                       amountIn: dbAmountIn,
                       amountOut: dbAmountOut,
                       tokenIn: dbTokenIn,
                       tokenOut: dbTokenOut,
                       maker: maker,
                   },
                   update: {
                       blockNumber: log.blockNumber || 0n,
                       chain: monitor.chainName,
                       dex: poolConfig.name,
                       amountIn: dbAmountIn,
                       amountOut: dbAmountOut,
                       tokenIn: dbTokenIn,
                       tokenOut: dbTokenOut,
                       maker: maker,
                   }
               });
               console.log('   -> Saved to DB');
           } catch (e) {
               console.error('   -> Failed to save swap to DB:', e);
           }

           const userResolved = await resolveAddress(maker);
           const explorerLink = `${explorerBaseUrl}/tx/${hash}`;
           const message = `🔄 *V4 SWAP ALERT!* (${poolInfo.pair})\n\n` +
             `${userResolved} **${action}** *${absAmount0.toLocaleString(undefined, {maximumFractionDigits: 2})} MOON*\n` +
             `For: ${absAmount1.toLocaleString(undefined, {maximumFractionDigits: 6})} ${poolInfo.token1.symbol}\n` +
             `Price: ${price.toFixed(6)} ${poolInfo.token1.symbol}\n` +
             `[View Transaction](${explorerLink})`;
             
           await sendTelegramMessage(message);
        }
      },
      poolConfig.name
    );
  }
}
