// Аудит Lighthouse для NFR-8 (інтерфейс завантажується не довше 2 с).
// Кожну сторінку проганяємо кілька разів (Lighthouse помітно «стрибає») і беремо медіану.
//
// Запуск (потрібні Node 18+, Chrome і запущений docker compose):
//   node tests/lighthouse/run-lighthouse.mjs [--runs 3] [--label before] [--base-url http://localhost:3000]
import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const args = Object.fromEntries(process.argv.slice(2).reduce((acc, a, i, all) =>
  (a.startsWith('--') ? [...acc, [a.slice(2), all[i + 1]]] : acc), []));
const BASE_URL = args['base-url'] ?? 'http://localhost:3000';
const RUNS = Number(args.runs ?? 3);
const LABEL = args.label ?? 'run';
const LIGHTHOUSE = 'lighthouse@13.5.0';

const PAGES = { catalog: '/catalog', login: '/login', register: '/register' };
const FORM_FACTORS = ['mobile', 'desktop'];
const OUT = join(dirname(fileURLToPath(import.meta.url)), 'reports', LABEL);
mkdirSync(OUT, { recursive: true });

const median = (xs) => [...xs].sort((a, b) => a - b)[Math.floor(xs.length / 2)];
const ms = (v) => `${Math.round(v)} мс`;

const rows = [];
for (const [page, path] of Object.entries(PAGES)) {
  for (const ff of FORM_FACTORS) {
    const results = [];
    for (let i = 1; i <= RUNS; i++) {
      const name = `${page}-${ff}-${i}`;
      // Відносний шлях + cwd: на Windows npx іде через оболонку, і пробіли в шляху ламають аргументи
      const lhArgs = ['--yes', LIGHTHOUSE, BASE_URL + path, '--quiet', '--output=json', '--output=html',
        `--output-path=./${name}`, '--chrome-flags=--headless=new',
        '--only-categories=performance,accessibility,best-practices,seo'];
      if (ff === 'desktop') lhArgs.push('--preset=desktop');
      execFileSync(process.platform === 'win32' ? 'npx.cmd' : 'npx', lhArgs,
        { stdio: 'inherit', cwd: OUT, shell: process.platform === 'win32' });
      const lhr = JSON.parse(readFileSync(join(OUT, `${name}.report.json`), 'utf8'));
      const a = lhr.audits;
      results.push({
        perf: lhr.categories.performance.score * 100,
        a11y: lhr.categories.accessibility.score * 100,
        bp: lhr.categories['best-practices'].score * 100,
        seo: lhr.categories.seo.score * 100,
        fcp: a['first-contentful-paint'].numericValue,
        lcp: a['largest-contentful-paint'].numericValue,
        tbt: a['total-blocking-time'].numericValue,
        cls: a['cumulative-layout-shift'].numericValue,
        si: a['speed-index'].numericValue,
        bytes: a['total-byte-weight'].numericValue,
      });
    }
    const m = (k) => median(results.map((r) => r[k]));
    rows.push({ page, ff, perf: m('perf'), a11y: m('a11y'), bp: m('bp'), seo: m('seo'), fcp: m('fcp'), lcp: m('lcp'),
      tbt: m('tbt'), cls: m('cls'), si: m('si'), bytes: m('bytes') });
  }
}

const header = '| Сторінка | Режим | Performance | FCP | LCP | TBT | CLS | Speed Index | Вага сторінки | Accessibility | Best Practices | SEO |\n' +
  '|---|---|---|---|---|---|---|---|---|---|---|---|\n';
const table = header + rows.map((r) =>
  `| ${r.page} | ${r.ff} | ${r.perf} | ${ms(r.fcp)} | ${ms(r.lcp)} | ${ms(r.tbt)} | ${r.cls.toFixed(3)} | ${ms(r.si)} | ` +
  `${Math.round(r.bytes / 1024)} КБ | ${r.a11y} | ${r.bp} | ${r.seo} |`).join('\n');

writeFileSync(join(OUT, 'summary.md'), `# Lighthouse: ${LABEL} (медіана ${RUNS} прогонів)\n\n${table}\n`);
writeFileSync(join(OUT, 'summary.json'), JSON.stringify(rows, null, 2));
console.log(`\n${table}\n\nЗвіти: ${OUT}`);
