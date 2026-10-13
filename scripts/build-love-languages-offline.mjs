import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseNotes, renderDay } from './build-love-languages.mjs';
import { dailyGuides } from './love-languages-editorial.mjs';

const [source, output] = process.argv.slice(2);
if (!source || !output) throw new Error('Usage: node scripts/build-love-languages-offline.mjs NOTES_DIRECTORY OUTPUT_HTML');
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const days = parseNotes(source);
const guides = new Map(dailyGuides.map(guide => [`2026-${guide[0]}`, guide]));
const chapters = [...new Map(days.map(day => [day.chapter, day.chapterTitle]))];
const escape = text => text.replace(/[&<>"']/g, character => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
}[character]));
const logo = fs.readFileSync(path.join(root, 'logo.png')).toString('base64');
const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>儿童爱之语 · 2026年每日共读合集</title>
<style>
:root { color-scheme: light; --navy:#1B3A6B; --gold:#C9A84C; --muted:#6B7A8D; --border:#DDE3EB; }
* { box-sizing:border-box; }
body { margin:0; background:#F5F7FA; color:#2C3E50; font-family:Georgia,"Songti SC","Noto Serif SC",serif; line-height:1.85; overflow-wrap:break-word; }
header, main, footer { max-width:820px; margin:auto; padding:24px; }
.brand { display:flex; align-items:center; gap:12px; color:var(--navy); }
.brand img { width:56px; height:56px; object-fit:contain; }
.brand small { display:block; color:var(--gold); }
h1 { color:var(--navy); font-size:1.9rem; line-height:1.5; margin:24px 0 8px; }
header p { margin:8px 0; color:var(--muted); }
main { padding-top:0; }
.filters { background:white; border:1px solid var(--border); border-radius:12px; padding:18px; margin-bottom:22px; }
.filter-row { display:flex; flex-wrap:wrap; gap:14px; }
label { flex:1 1 200px; color:var(--navy); font-weight:bold; }
select { display:block; width:100%; min-height:48px; margin-top:6px; padding:10px; font:inherit; font-size:16px; color:#2C3E50; background:white; border:1px solid var(--border); border-radius:6px; }
#selection-status { margin:12px 0 0; color:var(--muted); font-size:0.9rem; }
details { background:white; border:1px solid var(--border); border-radius:10px; margin-bottom:12px; scroll-margin-top:16px; }
details[hidden] { display:none; }
summary { display:flex; align-items:center; justify-content:space-between; gap:16px; padding:16px 18px; min-height:48px; color:var(--navy); font-weight:bold; cursor:pointer; list-style:none; }
summary::-webkit-details-marker { display:none; }
summary::after { content:"+"; color:var(--gold); font:bold 24px Arial,sans-serif; flex-shrink:0; }
details[open] > summary::after { content:"-"; }
summary:hover { background:#FDF6E3; border-radius:10px; }
summary:focus-visible, select:focus-visible { outline:3px solid var(--gold); outline-offset:2px; }
.faq-body { padding:0 18px 18px; }
h3 { color:var(--navy); font-size:1.05rem; margin:24px 0 8px; }
p { margin:12px 0; }
blockquote { margin:24px 0; border-left:4px solid var(--gold); background:#FDF6E3; padding:16px 24px; color:#5a4000; border-radius:0 8px 8px 0; font-style:italic; }
.daily-action { background:#FDF6E3; border-left:4px solid var(--gold); padding:1px 16px; }
.daily-chapter { color:var(--muted); font-size:0.9rem; }
ul { padding-left:24px; }
footer { text-align:center; color:var(--muted); font-size:0.9rem; }
@media(max-width:480px) { header,main,footer { padding:20px 16px; } main { padding-top:0; } h1 { font-size:1.5rem; } .filter-row { gap:10px; } summary { padding:14px; } .faq-body { padding:0 14px 14px; } }
@media print { body { background:white; } .filters { display:none; } details { break-inside:avoid; } summary::after { display:none; } }
</style>
</head>
<body>
<header>
  <div class="brand"><img src="data:image/png;base64,${logo}" alt="美嘉旷野书房"><div><strong>美嘉旷野书房</strong><small>感恩 · 敬畏 · 服务 · 成长</small></div></div>
  <h1>儿童爱之语 · 每日共读合集</h1>
  <p>2026年7月7日—9月28日</p>
  <p>书摘、分享、问题、微行动与家长回应</p>
</header>
<main>
  <div class="filters" hidden>
    <div class="filter-row">
      <label for="month-filter">按月份阅读<select id="month-filter"><option value="">全部月份</option>${[7,8,9].map(month => `<option value="${month}">${month}月</option>`).join('')}</select></label>
      <label for="chapter-filter">按章节阅读<select id="chapter-filter"><option value="">全部章节</option>${chapters.map(([chapter,title]) => `<option value="${chapter}">第${chapter}章 · ${escape(title)}</option>`).join('')}</select></label>
    </div>
    <p id="selection-status" role="status" aria-live="polite"></p>
  </div>
  ${days.map(day => {
    const guide = guides.get(day.id);
    if (!guide) throw new Error('Missing guide: ' + day.id);
    return renderDay(day, guide).replace('<details ', `<details data-month="${day.month}" data-chapter="${day.chapter}" `);
  }).join('\n')}
</main>
<footer>美嘉旷野书房 · 2026年共读记录</footer>
<script>
const monthFilter = document.getElementById('month-filter');
const chapterFilter = document.getElementById('chapter-filter');
const entries = [...document.querySelectorAll('main details')];
const status = document.getElementById('selection-status');
function filterEntries() {
  let count = 0;
  for (const entry of entries) {
    entry.hidden = Boolean((monthFilter.value && entry.dataset.month !== monthFilter.value) || (chapterFilter.value && entry.dataset.chapter !== chapterFilter.value));
    if (!entry.hidden) count++;
  }
  const selected = chapterFilter.value ? chapterFilter.selectedOptions[0].text : monthFilter.value ? monthFilter.value + '月' : '全部共读';
  status.textContent = selected + ' · ' + count + '天 · 点“＋”展开每日内容';
}
monthFilter.addEventListener('change', () => { chapterFilter.value = ''; filterEntries(); });
chapterFilter.addEventListener('change', () => { monthFilter.value = ''; filterEntries(); });
function openLinkedDay() {
  const target = document.getElementById(location.hash.slice(1));
  if (target instanceof HTMLDetailsElement) {
    monthFilter.value = target.dataset.month;
    chapterFilter.value = '';
    filterEntries();
    target.open = true;
    target.scrollIntoView();
  }
}
window.addEventListener('hashchange', openLinkedDay);
document.querySelector('.filters').hidden = false;
filterEntries();
openLinkedDay();
</script>
</body>
</html>`;
fs.writeFileSync(output, html);
console.log(`Created standalone HTML: ${output} (${(Buffer.byteLength(html) / 1024).toFixed(0)} KiB, ${days.length} days)`);
