const fs = require('fs');
const path = require('path');

const replacements = [
  { regex: /LumiForest/g, replacement: 'LumiForest' },
  { regex: /LumiForest - Retreat Ticket & Room Booking/g, replacement: 'LumiForest - Retreat Ticket & Room Booking' },
  { regex: /LumiForest Admin/g, replacement: 'LumiForest Admin' },
  { regex: /LumiForest Staff/g, replacement: 'LumiForest Staff' },
  { regex: /deluxetravel\.com/g, replacement: 'lumiforest.com' },
  { regex: /admin@deluxe\.com/g, replacement: 'admin@lumiforest.com' },
  { regex: /LumiForest Header/g, replacement: 'LumiForest Header' },
  { regex: />LumiForest</g, replacement: '>LumiForest<' },
  { regex: /Thanh Toán - LumiForest/g, replacement: 'Thanh Toán - LumiForest' },
  { regex: /của LumiForest/g, replacement: 'của LumiForest' },
  { regex: /brand-text">LumiForest/g, replacement: 'brand-text">LumiForest' },
  { regex: /text-primary">LumiForest/g, replacement: 'text-primary">LumiForest' }
];

function processDirectory(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    if (file === 'node_modules' || file === '.git') continue;
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      processDirectory(fullPath);
    } else if (fullPath.endsWith('.html') || fullPath.endsWith('.js') || fullPath.endsWith('.css')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let updated = false;
      for (const { regex, replacement } of replacements) {
        if (regex.test(content)) {
          content = content.replace(regex, replacement);
          updated = true;
        }
      }
      if (updated) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log(`Updated: ${fullPath}`);
      }
    }
  }
}

processDirectory('/Users/doxuanquang/Documents/BioWraps/Hotel/travel-frontend');
console.log('Replacement complete.');
