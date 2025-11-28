export * from '@prisma/client';
import { PrismaClient } from '@prisma/client';

declare global {
  var prisma: PrismaClient | undefined;
}

// Suppress the "could not find schema.prisma" warning
// This must be done BEFORE the client is instantiated
const originalWarn = console.warn;
const originalLog = console.log;
const originalError = console.error;

const shouldSuppress = (args: any[]) => {
  const msg = args[0];
  if (typeof msg === 'string') {
    if (msg.includes('could not immediately find its `schema.prisma`')) return true;
    if (msg.includes('bundler-investigation')) return true;
    if (msg.includes('We are interested in learning about your project setup')) return true;
    if (msg.includes('Please help us by answering a few questions')) return true;
  }
  return false;
};

console.warn = (...args) => {
  if (shouldSuppress(args)) return;
  originalWarn(...args);
};

console.log = (...args) => {
  if (shouldSuppress(args)) return;
  originalLog(...args);
};

console.error = (...args) => {
  if (shouldSuppress(args)) return;
  originalError(...args);
};

export const prisma = global.prisma || new PrismaClient({
  log: ['error'],
});

if (process.env.NODE_ENV !== 'production') global.prisma = prisma;
