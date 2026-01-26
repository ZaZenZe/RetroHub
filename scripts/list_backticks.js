const fs = require('fs');
const s = fs.readFileSync(process.argv[2] || 'frontend/src/pages/Profile.jsx', 'utf8');
const positions = [];
for (let i = 0; i < s.length; i++) {
  if (s[i] === '`') positions.push(i);
}
console.log('count', positions.length);
positions.forEach((pos, idx) => {
  const ctx = s.slice(Math.max(0, pos - 40), Math.min(s.length, pos + 40)).replace(/\n/g, '\n');
  console.log(`${idx + 1}. @${pos}\n${ctx}\n---`);
});
