const { prisma } = require('./dist/index.js');

async function main() {
  console.log('Prisma keys:', Object.keys(prisma));
  if (prisma.holder) {
    console.log('Holder model is defined.');
  } else {
    console.error('Holder model is UNDEFINED.');
  }
}

main().catch(console.error);
