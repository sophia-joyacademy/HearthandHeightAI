import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { dailyGuides, teacherBlocks, feedback, readingNotes } from './love-languages-editorial.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const chapters = [
  ['77 第一章 爱是教育孩子的基础.md', '爱是教育孩子的基础'],
  ['713 第二章 爱的语言之一：身体的接触.md', '身体的接触'],
  ['720 第三章 爱的语言之二：肯定的言词.md', '肯定的言词'],
  ['727 第四章 爱的语言之三：精心的时刻.md', '精心的时刻'],
  ['83 第五章 爱的语言之四：接受礼物.md', '接受礼物'],
  ['810 第六章 爱的语言之五：服务的行动.md', '服务的行动'],
  ['817 第七章 发现孩子的主要爱语.md', '发现孩子的主要爱语'],
  ['824 第八章 管教与爱的语言.md', '管教与爱的语言'],
  ['831 第九章 学习与爱的语言.md', '学习与爱的语言'],
  ['97 第十章 怒气与爱.md', '怒气与爱'],
  ['914 第十一章 在单亲家庭的爱语.md', '在单亲家庭的爱语'],
  ['928 第十二章 在婚姻中表达爱语.md', '在婚姻中表达爱语'],
];

export function parseNotes(directory) {
  const days = [];
  for (const [index, [filename, chapterTitle]] of chapters.entries()) {
    const text = fs.readFileSync(path.join(directory, filename), 'utf8');
    let current;
    for (const line of text.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (trimmed.startsWith('#')) continue;
      const date = trimmed.match(/^(\d{1,2})\/(\d{1,2})(.*)$/);
      if (date) {
        const id = `2026-${date[1].padStart(2, '0')}-${date[2].padStart(2, '0')}`;
        if (!current || current.id !== id) {
          if (days.some(day => day.id === id)) throw new Error(`Duplicate date: ${id}`);
          current = { id, month: Number(date[1]), day: Number(date[2]), chapter: index + 1, chapterTitle, lines: [] };
          days.push(current);
        }
        const remainder = date[3].trim();
        if (remainder && !remainder.startsWith(chapterTitle) && !remainder.startsWith('爱的语言之')) {
          current.lines.push(remainder, '');
        }
      } else if (current) {
        current.lines.push(line);
      }
    }
  }
  for (const day of days) {
    day.blocks = day.lines.join('\n').split(/\n\s*\n/).map(block => block.trim())
      .filter(block => block && !/^[-—\s]+$/.test(block) && !block.startsWith('!['));
  }
  days.sort((a, b) => a.id.localeCompare(b.id));
  if (days.length !== 84) throw new Error(`Expected 84 dated records, found ${days.length}`);
  return days;
}

const escape = value => String(value).replace(/[&<>"']/g, character => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
}[character]));
const paragraph = value => `<p>${escape(value).replace(/\n/g, '<br>')}</p>`;
const list = values => `<ul>${values.map(value => `<li>${escape(value)}</li>`).join('')}</ul>`;
const monthPage = month => `love-languages-journal-2026-${String(month).padStart(2, '0')}.html`;

const questionOverrides = {
  '08-26': '8.3（整理）请求、命令和其他行为管理方式，会给亲子双方带来怎样的影响？如何用尊重、清楚界限和技能训练替代身体惩罚与伤害？',
};
const personalOverrides = {
  '08-04': [
    '如果孩子没有感受到真正的关心，礼物可能被误当作爱的替代品。我在这一天特别提醒，要识别真实的爱，不用礼物补偿尊重、关怀或安全的缺失。礼物要与其他爱的表达同行。',
  ],
  '09-21': [
    '我们夫妻谈话有时很热烈，声音也会比较大。有一次在车里交流，孩子突然叫我们停下，我们才知道他觉得我们在吵架。虽然我们解释没有争吵，但孩子仍坚持自己的感受。这给我很大的提醒：孩子不喜欢父母在他面前大声、尖锐地说话，即使我们认为只是讨论。',
    '从此以后，我开始改变自己的表达方式，留意语音、语气、语调，尽量柔和，而不只是解释自己没有在吵架。',
  ],
  '09-28': [
    '《儿童爱之语》的学习到这里告一段落了，感恩有机会和大家共同学习如何爱我们的孩子。',
    '我对好父母的一些理解是：持续表达爱，学习积极的沟通与管教，先问孩子需要什么，管理自己的脾气，也帮助孩子逐渐学会处理怒气。这些方向需要智慧、耐心和不断的练习。',
    '每个人清单的优先次序不同，对于不同年龄的孩子，优先次序也不同。随时观察自己和孩子是否有连接，能不能欢笑在一起，能不能一起说点事，再考虑如何更上一层楼。',
    '这条道路随着孩子年龄的增长不断变化。小的时候关系可能很亲密，但长大后需要不一样了，而我们的成长还没有跟上。这就是我们需要不断学习的原因。',
    '我的孩子们都大了，我现在也在学习如何谦卑下来，了解成年子女的需要，让家庭不断成长。感恩我们可以在这条道路上做同路人。',
    '从十月开始，我们将一起分享《高效能家庭的七个习惯》，大家可以开始读起来。',
  ],
};

function questionsFor(day) {
  const key = day.id.slice(5);
  if (questionOverrides[key]) return [questionOverrides[key]];
  const questions = day.blocks.filter(block => /^\d+\.\d+\s/.test(block));
  if (key === '08-23') questions.push(day.blocks[1]);
  return questions;
}

function quoteFor(day) {
  const key = day.id.slice(5);
  if (['07-19', '08-09', '08-30', '09-06', '09-10', '09-11', '09-22', '09-23', '09-24', '09-25', '09-26', '09-27', '09-28'].includes(key)) return null;
  const index = key === '07-10' ? 1 : key === '09-17' ? 1 : 0;
  if ((teacherBlocks[key] || []).includes(index)) return null;
  const block = day.blocks[index];
  if (!block || /^\d+\.\d+/.test(block)) return null;
  const sentence = block.match(/^.*?[。！？]/s)?.[0];
  return sentence && sentence.length <= 150 ? sentence : null;
}

export function renderDay(day, guide) {
  const key = day.id.slice(5);
  const [, title, action] = guide;
  if (!day.blocks.length) {
    return `<details id="${day.id}">
      <summary><span><time datetime="${day.id}">2026年${day.month}月${day.day}日</time></span></summary>
      <div class="faq-body"></div>
    </details>`;
  }
  const personal = personalOverrides[key] || (teacherBlocks[key] || []).map(index => {
    const block = day.blocks[index];
    if (!block || /家长分享|老师反馈/.test(block) || /^\d+\.\d+/.test(block)) {
      throw new Error(`Invalid personal passage: ${key}, block ${index}`);
    }
    return block.replace(/\[[^\]]*\]/g, '').replace(/❤️|👍/g, '').trim();
  });
  const response = feedback[key];
  const quote = quoteFor(day);
  const questions = questionsFor(day);
  return `<details id="${day.id}">
    <summary><span><time datetime="${day.id}">2026年${day.month}月${day.day}日</time> · ${escape(title)}</span></summary>
    <div class="faq-body">
      <p class="daily-chapter">第${day.chapter}章 · ${escape(day.chapterTitle)}</p>
      ${quote ? `<h3>每日书摘 · 原笔记选句</h3><blockquote>${escape(quote)}</blockquote>` : ''}
      <h3>共读重点 · 整理</h3>
      ${paragraph(readingNotes[key])}
      ${personal.length ? `<h3>${['08-13', '08-17'].includes(key) ? '共读讲解 · 原笔记' : '我的分享 · 原笔记整理'}</h3>${personal.map(paragraph).join('\n')}` : ''}
      ${questions.length ? `<h3>今日问题 · 原笔记</h3>${questions.map(paragraph).join('\n')}` : ''}
      <h3>今日微行动 · 整理建议</h3>
      <div class="daily-action">${paragraph(action)}</div>
      ${response?.parents?.map(text => `<blockquote>${escape(text)}——家长分享</blockquote>`).join('\n') || ''}
      ${response?.teacher?.map(text => `<blockquote>${escape(text)}——老师反馈</blockquote>`).join('\n') || ''}
    </div>
  </details>`;
}

function wrapPage(title, subtitle, content, reference) {
  const nav = reference.match(/<nav>[\s\S]*?<\/nav>/)?.[0];
  const footer = reference.match(/<footer>[\s\S]*?<\/footer>/)?.[0];
  if (!nav || !footer) throw new Error('Missing reference navigation/footer');
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="description" content="2026年《儿童爱之语》每日共读：书摘选句、老师分享、讨论问题、微行动与匿名家长反馈。">
  <meta property="og:title" content="${escape(title)} — 美嘉旷野书房">
  <meta property="og:description" content="${escape(subtitle)}">
  <meta property="og:type" content="article">
  <meta property="og:image" content="https://hearthandheight.org/logo.png">
  <title>${escape(title)} — 美嘉旷野书房</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
${nav.replace('<a href="books.html">经典阅读</a>', '<a href="books.html" class="active" aria-current="true">经典阅读</a>')}
<div class="hero"><h1>${escape(title)}</h1><p class="subtitle">${escape(subtitle)}</p></div>
<main class="container daily-journal">
${content}
</main>
${footer.replace('© 2025', '© 2026')}
<script>
  function openLinkedDay() {
    if (!location.hash) return;
    const target = document.getElementById(location.hash.slice(1));
    if (target instanceof HTMLDetailsElement) {
      target.open = true;
      target.scrollIntoView();
    }
  }
  window.addEventListener('hashchange', openLinkedDay);
  openLinkedDay();
</script>
</body>
</html>
`;
}

export function build(directory) {
  if (!directory) throw new Error('Provide the original notes directory as the first argument');
  const days = parseNotes(directory);
  const guides = new Map(dailyGuides.map(guide => [`2026-${guide[0]}`, guide]));
  if (guides.size !== days.length) throw new Error('Editorial guide/date count mismatch');
  for (const day of days) {
    if (!guides.has(day.id)) throw new Error(`Missing daily guide: ${day.id}`);
    if (day.blocks.length && !readingNotes[day.id.slice(5)]) throw new Error(`Missing reading notes: ${day.id}`);
    const rawFeedback = day.blocks.some(block => /家长分享|老师反馈/.test(block));
    if (rawFeedback && !feedback[day.id.slice(5)]) throw new Error(`Feedback not accounted for: ${day.id}`);
  }
  const reference = fs.readFileSync(path.join(root, 'discipline-journal-2026-07.html'), 'utf8');
  for (const month of [7, 8, 9]) {
    const entries = days.filter(day => day.month === month);
    const previous = month > 7 ? `<a href="${monthPage(month - 1)}" class="btn btn-outline">← ${month - 1}月</a>` : '';
    const next = month < 9 ? `<a href="${monthPage(month + 1)}" class="btn btn-outline">${month + 1}月 →</a>` : '';
    const content = `
      <p><a href="books.html">经典阅读</a> › <a href="love-languages-journal.html">儿童爱之语 · 每日共读</a> › ${month}月</p>
      ${entries.map(day => renderDay(day, guides.get(day.id))).join('\n')}
      <p class="daily-navigation">${previous} <a href="love-languages-journal.html" class="btn">返回共读总览</a> ${next}</p>`;
    fs.writeFileSync(path.join(root, monthPage(month)), wrapPage(
      `2026年${month}月《儿童爱之语》· 每日共读`,
      `${month}/${entries[0].day}—${month}/${entries.at(-1).day} · 书摘、分享、问题、微行动与家长回应`,
      content, reference,
    ));
  }
  const chapterPage = chapter => `love-languages-journal-chapter-${chapter}.html`;
  const ranges = chapters.map(([, title], index) => {
    const entries = days.filter(day => day.chapter === index + 1);
    const first = entries[0];
    const last = entries.at(-1);
    const chapter = index + 1;
    const previous = chapter > 1 ? `<a href="${chapterPage(chapter - 1)}" class="btn btn-outline">← 上一章</a>` : '';
    const next = chapter < chapters.length ? `<a href="${chapterPage(chapter + 1)}" class="btn btn-outline">下一章 →</a>` : '';
    fs.writeFileSync(path.join(root, chapterPage(chapter)), wrapPage(
      `第${chapter}章 · ${title}`,
      `《儿童爱之语》· 2026年${first.month}月${first.day}日—${last.month}月${last.day}日`,
      `<p><a href="books.html">经典阅读</a> › <a href="love-languages-journal.html">儿童爱之语 · 每日共读</a> › 第${chapter}章</p>
      ${entries.map(day => renderDay(day, guides.get(day.id))).join('\n')}
      <p class="daily-navigation">${previous} <a href="love-languages-journal.html" class="btn">返回共读总览</a> ${next}</p>`,
      reference,
    ));
    return `<li id="chapter-${chapter}"><a href="${chapterPage(chapter)}">第${chapter}章 · ${escape(title)}<span class="daily-chapter">${first.month}/${first.day}—${last.month}/${last.day}</span></a></li>`;
  }).join('\n');
  const content = `
    <p><a href="books.html">经典阅读</a> › <a href="books.html#love-languages">《儿童爱之语》</a> › 2026年每日共读</p>
    <p>2026年7月7日至9月28日，我们一起读完《儿童爱之语》。这里不只保留章节概括，而是按日收录老师的分享、书摘选句、讨论问题、匿名家长反馈，并整理一个可以在生活中尝试的微行动。</p>
    <p>书籍作者：盖瑞·查普曼（Gary Chapman）、罗斯·坎贝尔（Ross Campbell）。</p>
    <h2>共读的起点 · 我的分享</h2>
    <p>最初我是在“亲密之旅”的课程中学到“要在感情的银行里存款”，后来又读过查普曼博士的《爱的五种语言》好几遍，开始对如何表达爱有了初步的认识。</p>
    <p>这一轮共读希望把表达爱的认识用在亲子生活中，和家长一起实践、一起学习。我们在《正面管教》中练习管理自己的情绪，接着在这本书中练习用孩子能感受到的方式表达爱。</p>
    <h2>按月阅读每日分享</h2>
    <div class="resource-card"><div class="resource-info"><h3>七月 · 爱的基础、接触、话语与陪伴</h3><p>7/7—7/31 · 25 个日期条目。从无条件的爱开始，读身体接触、肯定言词，并进入精心时刻。</p></div><a class="btn" href="${monthPage(7)}">进入七月每日共读 →</a></div>
    <div class="resource-card"><div class="resource-info"><h3>八月 · 礼物、服务、爱语与管教</h3><p>8/1—8/31 · 31 个日期条目。继续陪伴，再读礼物、服务、观察爱语、管教，月底进入学习主题。</p></div><a class="btn" href="${monthPage(8)}">进入八月每日共读 →</a></div>
    <div class="resource-card"><div class="resource-info"><h3>九月 · 学习、怒气与家庭关系</h3><p>9/1—9/28 · 28 个日期条目。读学习与情绪，单亲家庭的支持，婚姻中的爱语，最后共同结读。</p></div><a class="btn" href="${monthPage(9)}">进入九月每日共读 →</a></div>
    <h2>按章节阅读每日分享</h2>
    <ol class="daily-chapters">${ranges}</ol>
    <h2>怎样阅读每一天</h2>
    <ul>
      <li><strong>每日书摘：</strong>从提供的笔记中选短句；不是整章转载，也不把个人故事归为书中原文。</li>
      <li><strong>共读重点：</strong>根据当天内容整理，和摘录、个人经历分开。</li>
      <li><strong>我的分享：</strong>保留生活观察、家庭故事和反思。聊天符号、标点作适当整理。</li>
      <li><strong>今日问题：</strong>按原笔记保留讨论题和编号；少量安全相关措辞作反思性整理。</li>
      <li><strong>今日微行动：</strong>此次依据当天主题整理的具体建议，不冒充历史分享或家长已经完成的行动。</li>
      <li><strong>家长反馈与老师回应：</strong>放回对应日期，匿名整理、不作为逐字引文；不保留具体年龄、姓名和可识别家庭细节。</li>
    </ul>
    <p>原始笔记未修改，未作为公开下载文件上传。7/21 配图的来源和公开许可未确认，本页以文字整理相关讨论，不复制图片。读书经验不替代医学、心理或教育评估，也不把儿童困难归因于单一因素。</p>
    <h2>读完之后，继续一起成长</h2>
    <p>在 9/28 的结读分享中，老师坦诚，孩子已经成年，自己仍在学习如何谦卑地了解他们的需要。书读完了，表达爱、管理情绪和建立习惯的操练仍会继续。</p>
    <p><a href="${monthPage(9)}#2026-09-28" class="btn btn-outline">阅读结读分享 →</a> <a href="books.html#7-habits" class="btn">下一本：《高效能家庭的七个习惯》</a></p>
    <p><a href="books.html#love-languages">返回《儿童爱之语》导读</a></p>`;
  fs.writeFileSync(path.join(root, 'love-languages-journal.html'), wrapPage(
    '儿童爱之语 · 2026年每日共读',
    '7月7日—9月28日 · 读书摘、谈问题、做微行动，也听见家长真实的回应。',
    content, reference,
  ));
  console.log('Generated overview, three monthly pages and twelve chapter pages: 84 dated entries, 82 with source content.');
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  build(process.argv[2]);
}
