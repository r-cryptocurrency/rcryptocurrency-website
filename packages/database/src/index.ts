export * from '@prisma/client';
import { PrismaClient } from '@prisma/client';

declare global {
  var prisma: PrismaClient | undefined;
}

export const prisma = global.prisma || new PrismaClient({
  log: ['error'], // Suppress warnings and info logs
});

if (process.env.NODE_ENV !== 'production') global.prisma = prisma;
