import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { parseNotes, renderDay } from './build-love-languages.mjs';
import { dailyGuides, feedback } from './love-languages-editorial.mjs';

const [source, output, selection = '1'] = process.argv.slice(2);
if (!source || !output) throw new Error('Usage: node scripts/build-love-languages-wechat.mjs NOTES_DIRECTORY OUTPUT_HTML [1-12], or NOTES_DIRECTORY OUTPUT_DIRECTORY all');
const notes = parseNotes(source);
const guides = new Map(dailyGuides.map(guide => [`2026-${guide[0]}`, guide]));
const numbers = ['一', '二', '三', '四', '五', '六', '七', '八', '九', '十', '十一', '十二'];
const escape = text => text.replace(/[&<>"']/g, character => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
}[character]));
const paragraphStyle = 'margin:12px 0;line-height:1.9;font-size:16px;color:#2C3E50;';
const styles = {
  section: 'margin:28px 0;padding:0;',
  h2: 'margin:28px 0 16px;padding:8px 0 8px 12px;border-left:4px solid #C9A84C;color:#1B3A6B;font-size:19px;line-height:1.7;font-weight:bold;',
  h3: 'margin:24px 0 8px;color:#1B3A6B;font-size:17px;line-height:1.8;font-weight:bold;',
  p: paragraphStyle,
  blockquote: 'margin:20px 0;padding:16px 20px;border-left:4px solid #C9A84C;background-color:#FDF6E3;border-radius:0 8px 8px 0;color:#5a4000;font-style:italic;font-size:16px;line-height:1.9;',
  ul: 'margin:12px 0;padding-left:24px;',
  li: 'margin:8px 0;line-height:1.9;font-size:16px;',
  div: 'margin:0;padding:0;',
};
function buildChapter(chapter, filename) {
const days = notes.filter(day => day.chapter === chapter);
assert.ok(days.length, `No dates for chapter ${chapter}`);
const first = days[0];
const last = days.at(-1);
const title = `儿童爱之语｜第${numbers[chapter - 1]}章：${first.chapterTitle}`;
const content = days.map(day => {
  const guide = guides.get(day.id);
  if (!guide) throw new Error(`Missing guide: ${day.id}`);
  return renderDay(day, guide)
    .replace(/<details[^>]*>/, '<section>')
    .replace('</details>', '</section>')
    .replace('<summary>', '<h2>').replace('</summary>', '</h2>')
    .replace(/<\/?span>/g, '')
    .replace(/<time[^>]*>(.*?)<\/time>/g, '$1')
    .replace(/<p class="daily-chapter">.*?<\/p>/g, '')
    .replace(/<([a-z0-9]+)(?: class="([^"]+)")?>/g, (tag, name, className) => {
      let style = styles[name];
      if (className === 'daily-action') style = 'margin:12px 0;padding:1px 16px;border-left:4px solid #C9A84C;background-color:#FDF6E3;';
      return style ? `<${name} style="${style}">` : tag;
    });
}).join('\n');
const article = `<section style="max-width:720px;margin:0 auto;padding:16px;color:#2C3E50;font-family:Georgia,'Songti SC',serif;line-height:1.9;overflow-wrap:break-word;">
  <p style="margin:8px 0;color:#C9A84C;font-size:14px;letter-spacing:2px;">美嘉旷野书房 · 经典共读</p>
  <h1 style="margin:16px 0;color:#1B3A6B;font-size:24px;line-height:1.6;">${escape(title)}</h1>
  <p style="margin:8px 0;color:#6B7A8D;font-size:14px;">2026年${first.month}月${first.day}日—${last.month}月${last.day}日</p>
  ${chapter === 1 ? `<p style="${paragraphStyle}">我们一起学习用孩子能感受到的方式表达爱。从无条件的爱开始，把书中的启发带回每天的亲子生活。</p>` : ''}
  ${content}
  <p style="margin:28px 0 12px;padding-top:16px;border-top:1px solid #DDE3EB;color:#6B7A8D;font-size:14px;">《儿童爱之语》作者：盖瑞·查普曼、罗斯·坎贝尔。<br>美嘉旷野书房 · 2026年共读记录</p>
</section>`;
assert.ok(!/<(?:script|link|details|summary|img|a)\b|class=/.test(article), 'Article must be static, inline-styled and self-contained');
assert.equal([...content.matchAll(/<h2\b/g)].length, days.length, 'One daily heading per source date');
assert.ok(!/整理说明：|本日原笔记未记录家长反馈/.test(article), 'Unwanted editorial notices');
for (const day of days) {
  assert.ok(content.includes(`2026年${day.month}月${day.day}日`), `Missing date ${day.id}`);
  const action = guides.get(day.id)[2];
  if (action) assert.ok(content.includes(escape(action)), `Missing action ${day.id}`);
  for (const [items, label] of [[feedback[day.id.slice(5)]?.parents, '家长分享'], [feedback[day.id.slice(5)]?.teacher, '老师反馈']]) {
    for (const item of items || []) assert.ok(content.includes(`${escape(item)}——${label}</blockquote>`), `Missing feedback ${day.id}`);
  }
}
fs.writeFileSync(filename, `<!DOCTYPE html>
<html lang="zh-CN">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escape(title)}</title></head>
<body style="margin:0;background-color:#ffffff;">${article}</body>
</html>`);
console.log(`Created chapter ${chapter}: ${filename}; ${days.length} dates, inline styles, no scripts or external resources.`);
}

if (selection === 'all') {
  fs.mkdirSync(output, { recursive: true });
  for (let chapter = 1; chapter <= 12; chapter++) {
    buildChapter(chapter, path.join(output, `love-languages-wechat-chapter-${chapter}.html`));
  }
} else {
  const chapter = Number(selection);
  if (!Number.isInteger(chapter) || chapter < 1 || chapter > 12) throw new Error('Chapter must be 1-12 or all');
  buildChapter(chapter, output);
}
