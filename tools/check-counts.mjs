/* Numbers asserted on one page but evidenced on another drift the same way
   opening hours did. The home page claimed 13 signature cocktails while the bar
   page listed 10, plus 4 mocktails in their own section — a figure matching
   neither reading. This keeps the claim tied to the evidence. */
import { readFileSync } from 'node:fs';

const read = (f) => readFileSync(new URL(`../${f}`, import.meta.url), 'utf8');
const fails = [];

const drinks = read('drinks.html');
/* Count per section so mocktails are not counted as cocktails. */
const sections = [...drinks.matchAll(/<h3>([^<]+)<\/h3>([\s\S]*?)(?=<h3>|$)/g)]
  .map(m => [m[1].trim(), (m[2].match(/<article class="ck/g) || []).length]);
const cocktails = sections
  .filter(([name]) => !/mocktail|alcohol free/i.test(name))
  .reduce((n, [, c]) => n + c, 0);

const claim = read('index.html').match(/data-cocktail-count[^>]*>(\d+)</);
if (!claim) fails.push('index.html: no element carries data-cocktail-count');
else if (Number(claim[1]) !== cocktails) {
  fails.push(`index.html claims ${claim[1]} signature cocktails; drinks.html lists ${cocktails}`
    + `\n      (${sections.map(([n, c]) => `${n}: ${c}`).join(', ')})`);
}

if (fails.length) {
  console.error('\nA number on one page disagrees with another:\n');
  fails.forEach(f => console.error('  - ' + f));
  console.error('');
  process.exit(1);
}
console.log(`counts consistent (${cocktails} signature cocktails on drinks.html and on the home page)`);
