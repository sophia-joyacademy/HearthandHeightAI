import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseNotes } from './build-love-languages.mjs';
import { dailyGuides, feedback } from './love-languages-editorial.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const names = [
  'books.html', 'love-languages-journal.html',
  ...[7, 8, 9].map(month => `love-languages-journal-2026-0${month}.html`),
  ...Array.from({ length: 12 }, (_, index) => `love-languages-journal-chapter-${index + 1}.html`),
];
const escape = value => value.replace(/[&<>"']/g, character => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
}[character]));
let records = 0;
let actions = 0;
let emptyDays = 0;
const ids = [];
for (const name of names) {
  const html = fs.readFileSync(path.join(root, name), 'utf8');
  assert.ok(!/整理说明：|本日原笔记未记录家长反馈|原笔记未记录独立的讨论问题|原笔记本日未单独标出书摘/.test(html), `${name}: unwanted editorial notices`);
  assert.ok(!html.includes('本次整理依据十二章原始笔记，保留 84 个日期条目'), `${name}: unwanted overview explanation`);
  const pageIds = [...html.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]);
  assert.equal(new Set(pageIds).size, pageIds.length, `${name}: duplicate IDs`);
  for (const [, value] of html.matchAll(/\b(?:href|src)="([^"]+)"/g)) {
    if (/^(https?:|mailto:)/.test(value)) continue;
    const [filename, anchor] = value.split('#');
    const target = path.join(root, filename || name);
    assert.ok(fs.existsSync(target), `${name}: missing file ${value}`);
    if (anchor) assert.ok(fs.readFileSync(target, 'utf8').includes(`id="${anchor}"`), `${name}: missing anchor ${value}`);
  }
  if (name.includes('journal-2026')) {
    assert.ok(!/daily-index|按《正面管教》共读记录的方式|部分原笔记没有单独区分书摘与讲解/.test(html), `${name}: unwanted daily index or introductions`);
    const entries = [...html.matchAll(/<details id="(2026-\d\d-\d\d)">([\s\S]*?)<\/details>/g)];
    records += entries.length;
    for (const [, id, body] of entries) {
      ids.push(id);
      assert.ok(body.includes(`<time datetime="${id}">`), `${id}: missing date`);
      const guide = dailyGuides.find(guide => `2026-${guide[0]}` === id);
      assert.ok(guide, id);
      if (guide[2]) assert.ok(body.includes(escape(guide[1])), `${id}: missing title`);
      if (['08-13', '08-17'].includes(id.slice(5))) {
        assert.ok(body.includes('共读讲解 · 原笔记'), `${id}: avoid assigning ambiguous commentary to the teacher`);
        assert.ok(!body.includes('我的分享'), `${id}: ambiguous attribution`);
      }
      if (guide[2]) {
        actions++;
        assert.ok(body.includes(escape(guide[2])), `${id}: missing micro-action`);
        for (const heading of ['共读重点', '今日微行动']) {
          assert.ok(body.includes(heading), `${id}: missing ${heading}`);
        }
      } else {
        emptyDays++;
        assert.ok(body.includes('<div class="faq-body"></div>'), `${id}: day should remain blank`);
      }
      const response = feedback[id.slice(5)];
      for (const item of [...(response?.parents || []), ...(response?.teacher || [])]) {
        assert.ok(body.includes(escape(item)), `${id}: missing feedback`);
      }
      for (const [items, label] of [[response?.parents, '家长分享'], [response?.teacher, '老师反馈']]) {
        for (const item of items || []) {
          assert.ok(body.includes(`<blockquote>${escape(item)}——${label}</blockquote>`), `${id}: feedback should match the discipline journal quote presentation`);
        }
      }
    }
    assert.ok(!/苏老师|苏校|two loosers|快8岁|16岁的孩子|Attachments\//.test(html), `${name}: unredacted source details`);
  }
  console.log(`${name}: local links and anchors valid`);
}
assert.equal(records, 84);
assert.equal(actions, 82);
assert.equal(emptyDays, 2);
assert.equal(new Set(ids).size, 84);
for (let day = new Date('2026-07-07T00:00:00Z'); day <= new Date('2026-09-28T00:00:00Z'); day.setUTCDate(day.getUTCDate() + 1)) {
  assert.ok(ids.includes(day.toISOString().slice(0, 10)), `Missing calendar date ${day.toISOString()}`);
}
if (process.argv[2]) {
  const sources = parseNotes(process.argv[2]);
  for (let chapter = 1; chapter <= 12; chapter++) {
    const html = fs.readFileSync(path.join(root, `love-languages-journal-chapter-${chapter}.html`), 'utf8');
    const entries = [...html.matchAll(/<details id="(2026-\d\d-\d\d)">([\s\S]*?)<\/details>/g)];
    assert.deepEqual(entries.map(entry => entry[1]), sources.filter(day => day.chapter === chapter).map(day => day.id), `Chapter ${chapter}: wrong dates`);
    for (const [markup, id] of entries) {
      const month = id.slice(5, 7);
      const monthly = fs.readFileSync(path.join(root, `love-languages-journal-2026-${month}.html`), 'utf8');
      assert.ok(monthly.includes(markup), `${id}: chapter and monthly content should match`);
    }
  }
  console.log('All twelve chapters contain exactly their own dates, with identical monthly content.');
  for (const source of sources) {
    const html = fs.readFileSync(path.join(root, `love-languages-journal-2026-0${source.month}.html`), 'utf8');
    const body = html.match(new RegExp(`<details id="${source.id}">([\\s\\S]*?)</details>`))[1];
    for (const question of source.blocks.filter(block => /^\d+\.\d+\s/.test(block))) {
      if (source.id === '2026-08-26') {
        assert.ok(body.includes('8.3（整理）'), 'Missing documented question adaptation');
      } else {
        assert.ok(body.includes(escape(question).replace(/\n/g, '<br>')), `${source.id}: missing original question`);
      }
    }
  }
  console.log('Original daily questions retained, including repeated numbering; safety adaptation explicitly labeled.');
}
console.log('Passed: 84 unique consecutive dates, 82 micro-actions, two explicitly empty records, and all curated feedback.');
