
import fs from 'fs';

const CSV_PATH = '/home/jw/Documents/rcryptocurrency/MOONs/MoonDistributions.csv';

if (fs.existsSync(CSV_PATH)) {
  const content = fs.readFileSync(CSV_PATH, 'utf-8');
  const lines = content.split('\n').slice(0, 5);
  console.log('First 5 lines of CSV:');
  lines.forEach(line => console.log(line));
} else {
  console.log('CSV file not found');
}
