"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = void 0;
__exportStar(require("@prisma/client"), exports);
const client_1 = require("@prisma/client");
// Suppress the "could not find schema.prisma" warning
// This must be done BEFORE the client is instantiated
const originalWarn = console.warn;
const originalLog = console.log;
const originalError = console.error;
const shouldSuppress = (args) => {
    const msg = args[0];
    if (typeof msg === 'string') {
        if (msg.includes('could not immediately find its `schema.prisma`'))
            return true;
        if (msg.includes('bundler-investigation'))
            return true;
        if (msg.includes('We are interested in learning about your project setup'))
            return true;
        if (msg.includes('Please help us by answering a few questions'))
            return true;
    }
    return false;
};
console.warn = (...args) => {
    if (shouldSuppress(args))
        return;
    originalWarn(...args);
};
console.log = (...args) => {
    if (shouldSuppress(args))
        return;
    originalLog(...args);
};
console.error = (...args) => {
    if (shouldSuppress(args))
        return;
    originalError(...args);
};
exports.prisma = global.prisma || new client_1.PrismaClient({
    log: ['error'],
});
if (process.env.NODE_ENV !== 'production')
    global.prisma = exports.prisma;
