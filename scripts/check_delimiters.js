const fs = require('fs');
const path = require('path');
const file = path.resolve(process.argv[2] || 'frontend/src/pages/Profile.jsx');
const s = fs.readFileSync(file, 'utf8');
const counts = {
  '{': (s.match(/\{/g) || []).length,
  '}': (s.match(/\}/g) || []).length,
  '(': (s.match(/\(/g) || []).length,
  ')': (s.match(/\)/g) || []).length,
  '[': (s.match(/\[/g) || []).length,
  ']': (s.match(/\]/g) || []).length,
  '`': (s.match(/`/g) || []).length,
  "'": (s.match(/'/g) || []).length,
  '"': (s.match(/\"/g) || []).length,
};
console.log('counts:', counts);

// Find lines with odd number of single/double/backtick quotes
const lines = s.split(/\r?\n/);
const problems = [];
lines.forEach((ln, idx) => {
  const bi = (ln.match(/`/g) || []).length % 2 !== 0;
  const si = (ln.match(/(?<!\\)'/g) || []).length % 2 !== 0;
  const di = (ln.match(/(?<!\\)"/g) || []).length % 2 !== 0;
  if (bi || si || di) problems.push({ line: idx + 1, backtick: bi, single: si, double: di, text: ln.trim() });
});
if (problems.length) {
  console.log('\nPossible unterminated quotes on these lines:');
  problems.forEach(p => console.log(`  L${p.line}: bt=${p.backtick} sq=${p.single} dq=${p.double} -> ${p.text}`));
} else {
  console.log('\nNo per-line unterminated quote heuristics found.');
}

// Heuristic: find template literals that contain unescaped ${ or unmatched braces inside them
const templateProblems = [];
let i = 0;
while (i < s.length) {
  const bt = s.indexOf('`', i);
  if (bt === -1) break;
  const end = s.indexOf('`', bt + 1);
  if (end === -1) { templateProblems.push({ at: bt }); break; }
  const body = s.slice(bt + 1, end);
  const openExpr = (body.match(/\${/g) || []).length;
  const closeExpr = (body.match(/}/g) || []).length; // rough
  if (openExpr !== 0 && closeExpr < openExpr) templateProblems.push({ at: bt, bodyPreview: body.slice(0, 80) });
  i = end + 1;
}
if (templateProblems.length) {
  console.log('\nTemplate-literal heuristics found issues:');
  templateProblems.forEach(p => console.log('  at', p.at, p.bodyPreview || '')); 
} else {
  console.log('\nNo template-literal heuristics reported problems.');
}

process.exit(problems.length || templateProblems.length ? 2 : 0);
