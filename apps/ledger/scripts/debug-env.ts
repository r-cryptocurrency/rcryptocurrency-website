import * as path from 'path';
import * as dotenv from 'dotenv';
import * as fs from 'fs';

console.log('__dirname:', __dirname);
const envPath = path.resolve(__dirname, '../../../.env');
console.log('Resolved .env path:', envPath);
console.log('File exists:', fs.existsSync(envPath));

const result = dotenv.config({ path: envPath });
console.log('Dotenv result:', result.error ? result.error.message : 'Success');
console.log('TELEGRAM_BOT_TOKEN:', process.env.TELEGRAM_BOT_TOKEN ? 'Set' : 'Not Set');
