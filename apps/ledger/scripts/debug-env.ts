import * as path from 'path';
import * as dotenv from 'dotenv';
import * as fs from 'fs';

console.log('process.cwd():', process.cwd());
console.log('__dirname:', __dirname);

// PM2 sets cwd to apps/ledger, so go up 2 levels to reach project root
const envPath = path.resolve(process.cwd(), '../../.env');
console.log('Resolved .env path:', envPath);
console.log('File exists:', fs.existsSync(envPath));

const result = dotenv.config({ path: envPath });
console.log('Dotenv result:', result.error ? result.error.message : 'Success');
console.log('TELEGRAM_BOT_TOKEN:', process.env.TELEGRAM_BOT_TOKEN ? 'Set' : 'Not Set');
console.log('MOON_NOTIFICATION_THRESHOLD:', process.env.MOON_NOTIFICATION_THRESHOLD);
