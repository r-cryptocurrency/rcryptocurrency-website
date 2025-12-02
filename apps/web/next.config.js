/** @type {import('next').NextConfig} */
const path = require('path');

// Nuclear option for suppressing Prisma warnings
// We patch process.stdout and process.stderr because console.warn might be bypassed
// or the warnings might be coming from a subprocess where we can't easily reach console.
const originalStdoutWrite = process.stdout.write.bind(process.stdout);
const originalStderrWrite = process.stderr.write.bind(process.stderr);

const shouldSuppress = (str) => {
  if (!str || typeof str !== 'string') return false;
  if (str.includes('could not immediately find its `schema.prisma`')) return true;
  if (str.includes('bundler-investigation')) return true;
  if (str.includes('We are interested in learning about your project setup')) return true;
  if (str.includes('Please help us by answering a few questions')) return true;
  return false;
};

process.stdout.write = (chunk, encoding, callback) => {
  if (shouldSuppress(chunk.toString())) {
    if (callback) callback();
    return true;
  }
  return originalStdoutWrite(chunk, encoding, callback);
};

process.stderr.write = (chunk, encoding, callback) => {
  if (shouldSuppress(chunk.toString())) {
    if (callback) callback();
    return true;
  }
  return originalStderrWrite(chunk, encoding, callback);
};

// Also patch console methods just in case
const originalWarn = console.warn;
console.warn = (...args) => {
  const msg = args[0];
  if (typeof msg === 'string' && shouldSuppress(msg)) return;
  originalWarn(...args);
};

const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@rcryptocurrency/ui', '@rcryptocurrency/database'],
  experimental: {
    outputFileTracingRoot: path.join(__dirname, '../../'),
  },
  webpack: (config, { isServer }) => {
    return config;
  },
}

module.exports = nextConfig
