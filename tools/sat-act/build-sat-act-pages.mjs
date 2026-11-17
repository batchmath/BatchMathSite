#!/usr/bin/env node
// Generates the static SAT & ACT Math Practice section from the imported records.
//
//   node tools/sat-act/build-sat-act-pages.mjs            build pages, catalog, then run the SEO build on sat-act-math/
//   node tools/sat-act/build-sat-act-pages.mjs --no-seo   build only (used by QA in a scratch copy)
//
// Output (fully regenerated each run, deterministic):
//   sat-act-math/index.html                       library home: Practice by Topic / Mixed Practice
//   sat-act-math/problems/index.html              every numbered question
//   sat-act-math/problems/<slug>/index.html       one indexable page per question (permanent URL)
//   sat-act-math/topics/<subject>/index.html      one page per subject that has questions
//   assets/sat-act/catalog.js                     metadata used for filters and practice sessions
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { loadLibrary, SECTION } from './lib/library.mjs';
import { escapeHtml as esc, inline, displayMath } from './lib/markup.mjs';
import { renderFigure } from './lib/figure.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(process.env.BM_ROOT || path.resolve(HERE, '../..'));
// BM_SAT_ACT_RECORDS / BM_SAT_ACT_REGISTRY let QA build a scratch copy from other inputs.
const lib = loadLibrary(HERE, {
  recordsDir: process.env.BM_SAT_ACT_RECORDS || undefined,
  registryPath: process.env.BM_SAT_ACT_REGISTRY || undefined
});
const TYPED = 'student_produced_response';
const OUT = path.join(ROOT, SECTION.replace(/^\/|\/$/g, ''));
const MAX_TITLE = 85;

const count = (n, word = 'question') => `${n} ${word}${n === 1 ? '' : 's'}`;
const isPreview = !lib.releaseReady;

function writePage(url, html) {
  const file = path.join(ROOT, url.replace(/^\//, ''), 'index.html');
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, html);
}

function title(text) {
  if (text.length > MAX_TITLE) throw new Error(`title longer than ${MAX_TITLE} characters: ${text}`);
  return text;
}

const MATHJAX = `<script>
window.MathJax = {
  tex: {
    inlineMath: [['\\\\(', '\\\\)']],
    displayMath: [['\\\\[', '\\\\]']],
    processEscapes: true,
    macros: { htmlClass: ['\\\\class{#1}{#2}', 2], frac: ['\\\\dfrac{#1}{#2}', 2] }
  },
  chtml: { scale: 1 },
  options: {
    enableMenu: false,
    menuOptions: { settings: { explorer: false, zoom: 'NoZoom', inTabOrder: false } }
  }
};
</script>
<script defer src="https://cdn.jsdelivr.net/npm/mathjax@4.1.3/tex-chtml.js"></script>`;

function shell({ pageTitle, description, page, body, math = false, current = false }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>${esc(title(pageTitle))}</title>
<meta name="description" content="${esc(description)}">
<link rel="icon" href="/favicon.ico" sizes="any">
<link rel="icon" type="image/svg+xml" href="/favicon.svg">
<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32.png">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<link rel="manifest" href="/manifest.webmanifest">
<meta name="theme-color" content="#030303">
<meta name="application-name" content="BatchMath">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black">
<meta name="apple-mobile-web-app-title" content="BatchMath">
<link rel="stylesheet" href="/assets/site.css" data-batchmath-shared-style="v10.0">
<link rel="stylesheet" href="/assets/sat-act/sat-act.css">
${math ? MATHJAX + '\n' : ''}<script src="/assets/batchmath-storage.js" defer></script>
<script src="/assets/answer-normalization.js"></script>
<script src="/assets/pwa.js" defer></script>
<script src="/assets/sat-act/catalog.js" defer></script>
<script src="/assets/sat-act/sat-act-practice.js" defer></script>
<!-- Google tag (gtag.js) -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-377MTFXSF3"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-377MTFXSF3');
</script>
</head>
<body data-satact-page="${page}">
<a class="skip-link" href="#main-content">Skip to main content</a>
<header class="topbar">
  <img class="corner" src="/assets/batchmath-portrait.jpg" alt="">
  <a class="logo" href="/">BatchMath<span class="tm-mark">™</span></a>
  <div class="profile">
    <img src="/assets/batchmath-portrait.jpg" alt="BatchMath">
    <button class="menu-toggle" type="button" aria-expanded="false" aria-haspopup="true" aria-controls="course-menu" aria-label="Open course menu">COURSES ▼</button>
    <nav id="course-menu" class="dropdown" aria-label="Main navigation">
      <a href="/im1/">Integrated Math 1</a>
      <a href="/calculus-prep/">Calculus Prep</a>
      <a href="/ap-calculus/">AP Calculus AB</a>
      <a href="/archive/" data-bm-archive-nav="1">Problem of the Day</a>
      <a href="${SECTION}" class="current-section"${current ? ' aria-current="page"' : ''}>SAT &amp; ACT Math</a>
      <a href="/about/" data-bm-about-nav="1">About</a>
      <a href="/">Home</a>
    </nav>
  </div>
</header>
<main id="main-content" class="satact-main">
${isPreview ? previewNotice() : ''}${body}
</main>
<footer class="footer"><div class="bm-footer-main">© 2026 BatchMath. All rights reserved. BatchMath™.</div><div class="bm-footer-links"><a href="${SECTION}">SAT &amp; ACT Math Practice</a><a href="/about/">About BatchMath</a></div><div class="bm-legal-note">SAT® is a trademark registered by the College Board. ACT® is a registered trademark of ACT Education Corp. Neither organization is affiliated with, nor endorses, this website. These are original BatchMath practice questions, not official SAT or ACT questions.</div></footer>
<script data-batchmath-menu-a11y="v9.5">
document.addEventListener("DOMContentLoaded",function(){
  var b=document.querySelector(".menu-toggle"),m=document.querySelector("#course-menu");
  if(!b||!m)return;
  var sync=function(){b.setAttribute("aria-expanded",m.classList.contains("open")?"true":"false");};
  b.addEventListener("click",function(e){e.stopPropagation();m.classList.toggle("open");sync();});
  document.addEventListener("click",function(){if(m.classList.contains("open")){m.classList.remove("open");sync();}});
  m.addEventListener("click",function(e){e.stopPropagation();});
  document.addEventListener("keydown",function(e){if(e.key==="Escape"&&m.classList.contains("open")){m.classList.remove("open");sync();b.focus();}});
  sync();
});
</script>
</body>
</html>
`;
}

function previewNotice() {
  return `<div class="satact-preview-notice" role="note" data-satact-content-status="${esc(lib.contentStatus)}"><strong>Development preview.</strong> These practice questions are awaiting authorization for website publication.</div>
`;
}

function problemItem(p) {
  return `<li class="satact-problem-item" data-problem-id="${esc(p.id)}" data-subject="${esc(p.subject.slug)}" data-skill="${esc(p.skill.id)}" data-exams="${esc(p.exams.join(' '))}" data-difficulty="${esc(p.difficulty.value)}">
<span class="satact-number" aria-hidden="true">#${p.displayNumber}</span>
<span class="satact-problem-item-body"><a class="satact-problem-link" href="${p.url}"><span class="sr-only">Question ${p.displayNumber}: </span>${esc(p.title)}</a>
<span class="satact-meta"><span>${esc(p.subject.label)} › ${esc(p.skill.label)}</span><span>${esc(p.difficulty.label)}</span><span>${p.hasVideo ? 'Video explanation' : 'Written solution'}</span></span></span>
</li>`;
}

function startLink({ label, href, mode, subject = '', skill = '', size, primary = false }) {
  return `<a class="satact-btn${primary ? ' satact-btn-primary' : ''}" href="${href}" data-start-practice="1" data-mode="${mode}"${subject ? ` data-subject="${esc(subject)}"` : ''}${skill ? ` data-skill="${esc(skill)}"` : ''} data-size="${size}">${esc(label)}</a>`;
}

// ---------------------------------------------------------------- landing page
function landingPage() {
  const total = lib.problems.length;
  const subjectCards = lib.subjects.map(s => `<article class="satact-subject-card" data-subject="${esc(s.slug)}">
<h3><a href="${s.url}">${esc(s.label)}</a></h3>
<p class="satact-count" data-subject-count="${esc(s.slug)}">${count(s.problems.length)}</p>
<ul class="satact-skill-list">
${s.skills.map(k => `<li class="satact-skill-row" data-skill="${esc(k.id)}">
<span class="satact-skill-name"><a href="${s.url}#${esc(k.id)}">${esc(k.label)}</a><span class="satact-count" data-skill-count="${esc(k.id)}">${count(k.problems.length)}</span></span>
${startLink({ label: 'Practice', href: k.problems[0].url, mode: 'topic', subject: s.slug, skill: k.id, size: k.problems.length })}
</li>`).join('\n')}
</ul>
</article>`).join('\n');
  const subjectOptions = lib.subjects.map(s => `<option value="${esc(s.slug)}">${esc(s.label)} (${s.problems.length})</option>`).join('');
  const skillOptions = lib.subjects.flatMap(s => s.skills.map(k => `<option value="${esc(k.id)}" data-subject="${esc(s.slug)}">${esc(k.label)} (${k.problems.length})</option>`)).join('');
  const difficultyOptions = lib.difficulties.map(d => `<option value="${esc(d.value)}">${esc(d.label)} (${lib.problems.filter(p => p.difficulty.value === d.value).length})</option>`).join('');
  const body = `<section class="satact-hero" aria-labelledby="satact-title">
<p class="satact-kicker">Original practice · instant feedback · worked solutions</p>
<h1 id="satact-title">SAT &amp; ACT Math Practice</h1>
<p class="satact-hero-text">Individually numbered SAT and ACT math questions, each with a permanent page. Check your answer instantly, then study a step-by-step written solution. Video explanations are added to questions as they are published.</p>
<p class="satact-library-stats" data-satact-stats="1"><span>${count(total)} available</span><span>${count(lib.subjects.length, 'subject')}</span></p>
</section>
<section id="satact-resume" class="satact-resume" aria-label="Practice session in progress" hidden></section>
<nav class="satact-mode-grid" aria-label="Ways to practice">
<a class="satact-mode-card" href="#by-topic"><span class="satact-mode-icon" aria-hidden="true">∠</span><span class="satact-mode-title">Practice by Topic</span><span class="satact-mode-text">Choose a subject and a specific skill.</span></a>
<a class="satact-mode-card" href="#mixed"><span class="satact-mode-icon" aria-hidden="true">⇄</span><span class="satact-mode-title">Mixed Practice</span><span class="satact-mode-text">A shuffled set from the whole library, with no repeats.</span></a>
</nav>
<section class="satact-filters" aria-labelledby="satact-filters-title">
<h2 id="satact-filters-title">Filter by Difficulty</h2>
<div class="satact-filter-row">
<div class="satact-field"><label class="bm-practice-select-label" for="satact-difficulty">Difficulty</label><select id="satact-difficulty" class="bm-practice-select" data-filter="difficulty"><option value="all">Any difficulty (${total})</option>${difficultyOptions}</select></div>
</div>
<p class="satact-filter-summary" id="satact-filter-summary" role="status">${count(total)} match these filters.</p>
</section>
<section id="by-topic" class="satact-section" aria-labelledby="by-topic-title">
<h2 id="by-topic-title">Practice by Topic</h2>
<p class="satact-section-intro">Each skill shows how many questions are available right now. The library grows as new questions are approved, so some skills currently have just one question.</p>
<div class="satact-subject-grid" id="satact-subject-grid">
${subjectCards}
</div>
<div class="satact-empty" id="satact-topic-empty" hidden><h3>No questions match these filters yet.</h3><p>Choose a different difficulty.</p><button type="button" class="satact-btn" data-reset-filters="1">Reset Filters</button></div>
</section>
<section id="mixed" class="satact-section" aria-labelledby="mixed-title">
<h2 id="mixed-title">Mixed Practice</h2>
<p class="satact-section-intro">Work through a shuffled set of different questions. A question does not repeat until you have seen every question in the set.</p>
<form class="satact-mixed-form" id="satact-mixed-form">
<div class="satact-filter-row">
<div class="satact-field"><label class="bm-practice-select-label" for="satact-mixed-subject">Subject</label><select id="satact-mixed-subject" class="bm-practice-select"><option value="all">All subjects</option>${subjectOptions}</select></div>
<div class="satact-field"><label class="bm-practice-select-label" for="satact-mixed-skill">Skill</label><select id="satact-mixed-skill" class="bm-practice-select"><option value="all">All skills</option>${skillOptions}</select></div>
<div class="satact-field"><label class="bm-practice-select-label" for="satact-mixed-size">Questions</label><select id="satact-mixed-size" class="bm-practice-select"><option value="all">All available (${total})</option></select></div>
</div>
<p class="satact-filter-summary" id="satact-mixed-summary" role="status">${count(total)} available for mixed practice.</p>
<button type="submit" class="satact-btn satact-btn-primary" id="satact-mixed-start">Start Mixed Practice</button>
<div class="satact-empty" id="satact-mixed-empty" hidden><h3>No questions match these filters yet.</h3><p>Choose a different subject, skill or difficulty.</p><button type="button" class="satact-btn" data-reset-filters="1">Reset Filters</button></div>
</form>
<noscript><p class="satact-noscript">Mixed practice needs JavaScript. You can still open any question from the <a href="${SECTION}problems/">numbered question list</a>.</p></noscript>
</section>
<section class="satact-section" aria-labelledby="browse-title">
<h2 id="browse-title">Browse Every Question</h2>
<p class="satact-section-intro">Every question keeps its number and its own page, so you can return to it or share it.</p>
<p><a class="satact-btn" href="${SECTION}problems/">See All ${count(total)}</a></p>
</section>`;
  return shell({
    pageTitle: 'SAT & ACT Math Practice | Numbered Practice Questions | BatchMath',
    description: `Free SAT and ACT math practice from BatchMath: ${count(total)} individually numbered questions by topic or in mixed sets, with instant feedback and step-by-step written solutions.`,
    page: 'landing', body, current: true
  });
}

// ---------------------------------------------------------------- all problems
function problemsIndexPage() {
  const body = `<section class="satact-page-head" aria-labelledby="problems-title">
<p class="satact-kicker">SAT &amp; ACT Math Practice</p>
<h1 id="problems-title">All SAT &amp; ACT Practice Questions</h1>
<p class="satact-hero-text">${count(lib.problems.length)} so far. Each number is permanent: questions are added to the end of the list and never renumbered.</p>
<p><a class="satact-btn satact-btn-primary" href="${SECTION}#mixed">Start Mixed Practice</a> <a class="satact-btn" href="${SECTION}#by-topic">Practice by Topic</a></p>
</section>
<ol class="satact-problem-list" aria-label="Numbered questions">
${lib.problems.map(problemItem).join('\n')}
</ol>`;
  return shell({
    pageTitle: 'All SAT & ACT Math Practice Questions | BatchMath',
    description: `Every numbered BatchMath SAT and ACT math practice question in one list: ${count(lib.problems.length)}, each with answer choices, instant feedback and a step-by-step solution.`,
    page: 'problems', body
  });
}

// ---------------------------------------------------------------- topic pages
function topicPage(s) {
  const others = lib.subjects.filter(o => o.slug !== s.slug);
  const body = `<section class="satact-page-head" aria-labelledby="topic-title">
<p class="satact-kicker">SAT &amp; ACT Math Practice · Topic</p>
<h1 id="topic-title">${esc(s.label)}</h1>
<p class="satact-hero-text">${count(s.problems.length)} available in ${count(s.skills.length, 'skill')}.${s.problems.length === 1 ? ' More questions will be added as they are approved.' : ''}</p>
<p>${startLink({ label: `Practice All ${s.label} (${count(s.problems.length)})`, href: s.problems[0].url, mode: 'topic', subject: s.slug, size: s.problems.length, primary: true })}</p>
</section>
${s.skills.map(k => `<section class="satact-skill-section" id="${esc(k.id)}" aria-labelledby="skill-${esc(k.id)}">
<h2 id="skill-${esc(k.id)}">${esc(k.label)}</h2>
<p class="satact-skill-desc">${esc(k.sourceName)}</p>
<p class="satact-count">${count(k.problems.length)} available</p>
<p>${startLink({ label: `Practice This Skill (${count(k.problems.length)})`, href: k.problems[0].url, mode: 'topic', subject: s.slug, skill: k.id, size: k.problems.length })}</p>
<ol class="satact-problem-list" aria-label="${esc(k.label)} questions">
${k.problems.map(problemItem).join('\n')}
</ol>
</section>`).join('\n')}
${others.length ? `<nav class="satact-other-topics" aria-labelledby="other-topics-title">
<h2 id="other-topics-title">Other Topics</h2>
<ul>${others.map(o => `<li><a href="${o.url}">${esc(o.label)}</a> <span class="satact-count">${count(o.problems.length)}</span></li>`).join('')}</ul>
</nav>` : ''}`;
  return shell({
    pageTitle: `${s.label} Practice | SAT & ACT Math | BatchMath`,
    description: `SAT and ACT ${s.label.toLowerCase()} practice: ${count(s.problems.length)} numbered question${s.problems.length === 1 ? '' : 's'} with instant feedback and step-by-step written solutions from BatchMath.`,
    page: 'topic', body
  });
}

// ---------------------------------------------------------------- problem pages
function stem(record) {
  return record.question.stem.map(part => typeof part === 'string'
    ? `<p>${inline(part)}</p>`
    : displayMath(part.math)).join('\n');
}

function solutionStep(step, index) {
  const lines = (step.lines || []).map(line => {
    const label = line.label ? `<p class="satact-line-label">${inline(line.label)}</p>` : '';
    return label + displayMath(line.tex);
  }).join('\n');
  let check = '';
  if (step.check) {
    const verdict = step.check.valid ? 'This value checks.' : 'This value does not check.';
    check = `<div class="satact-check ${step.check.valid ? 'is-valid' : 'is-invalid'}">${step.check.lines.map(l => displayMath(l.tex)).join('\n')}<p class="satact-check-verdict">${verdict}</p></div>`;
  }
  return `<li class="satact-step" id="step-${esc(step.id)}">
<h3><span class="satact-step-number">Step ${index + 1}</span> ${esc(step.title)}</h3>
<p>${inline(step.caption)}</p>
${step.caption2 ? `<p>${inline(step.caption2)}</p>\n` : ''}${step.note ? `<p class="satact-step-note">${inline(step.note)}</p>\n` : ''}${lines}${check}
</li>`;
}

function problemData(p, next) {
  const v = p.video || {};
  const data = {
    id: p.id,
    number: p.number,
    displayNumber: p.displayNumber,
    url: p.url,
    title: p.title,
    subject: p.subject.slug,
    skill: p.skill.id,
    skills: p.record.classification.skills,
    exams: p.exams,
    difficulty: p.difficulty.value,
    format: p.record.format,
    answer: p.record.format === TYPED ? null : p.record.answer.label,
    accepted: p.record.format === TYPED ? p.record.answer.accepted : undefined,
    video: {
      youtubeId: v.published && v.youtubeId ? v.youtubeId : null,
      explanationStartSeconds: v.explanationStartSeconds ?? null
    },
    nextByNumber: next ? next.url : null
  };
  return JSON.stringify(data).replace(/</g, '\\u003c');
}

function problemPage(p, index) {
  const r = p.record;
  const prev = lib.problems[index - 1] || null;
  const next = lib.problems[index + 1] || null;
  const typed = r.format === TYPED;
  if (typed && !(Array.isArray(r.answer.accepted) && r.answer.accepted.length)) throw new Error(`${p.id}: typed answer without accepted values`);
  if (!typed && r.format !== 'multiple_choice_4') throw new Error(`${p.id}: unsupported question format ${r.format}`);
  const typedBlock = `<div class="satact-typed"><label for="satact-answer-input">Your answer<input id="satact-answer-input" name="satact-typed-answer" type="text" inputmode="decimal" autocomplete="off" spellcheck="false" aria-describedby="satact-typed-help"></label><p id="satact-typed-help" class="satact-count">Enter a number such as 9, 3/4 or 0.75. Equivalent forms are accepted.</p></div>`;
  const choices = r.choices.map(c => `<label class="satact-choice" data-choice="${c.label}">
<input type="radio" name="satact-answer" value="${c.label}">
<span class="satact-choice-letter" aria-hidden="true">${c.label}</span><span class="sr-only">Choice ${c.label}: </span>
<span class="satact-choice-body">${inline(c.display)}</span>
<span class="satact-choice-status" aria-hidden="true"></span>
</label>`).join('\n');
  const wrong = r.choices.filter(c => !c.correct);
  const yourAnswer = wrong.map(c => `<div class="satact-your-answer" data-your-answer="${c.label}" hidden>
<h3>Your answer: ${c.label}</h3>
<p>${inline(c.why)}</p>
</div>`).join('\n');
  const tags = [
    `<li><a href="${p.subject.url}#${esc(p.skill.id)}">${esc(p.subject.label)} › ${esc(p.skill.label)}</a></li>`,
    `<li>${esc(p.difficulty.label)}</li>`,
    ...p.secondarySkills.map(k => `<li>Also practices: ${esc(k.label)}</li>`)
  ].join('');
  const body = `<div id="satact-session-bar" class="satact-session-bar" hidden></div>
<article class="satact-problem" aria-labelledby="problem-title" data-problem-id="${esc(p.id)}">
<header class="satact-problem-header">
<h1 id="problem-title"><span class="satact-number">#${p.displayNumber}</span> <span class="satact-title-text">${esc(p.title)}</span></h1>
<ul class="satact-tags" aria-label="Question details">${tags}</ul>
<p class="satact-original-note">Original BatchMath practice question · not an official SAT® or ACT® question</p>
</header>
<section class="satact-question-card" aria-label="Question">
<div class="satact-stem">
${stem(r)}
</div>
${renderFigure(r)}
<p class="satact-prompt">${inline(r.question.prompt)}</p>
<form class="satact-answer-form" id="satact-answer-form" novalidate>
${typed ? typedBlock : `<fieldset class="satact-choices">
<legend class="sr-only">Answer choices</legend>
${choices}
</fieldset>`}
<div class="satact-actions" id="satact-actions">
<button type="submit" class="satact-btn satact-btn-primary" id="satact-check">Check Answer</button>
<button type="button" class="satact-btn" id="satact-watch" hidden>Watch Video Explanation</button>
<button type="button" class="satact-btn" id="satact-show-solution" hidden>View Written Solution</button>
<a class="satact-btn satact-btn-next" id="satact-next" href="${next ? next.url : `${SECTION}problems/`}">Next Problem</a>
</div>
</form>
<div id="satact-feedback" class="satact-feedback" tabindex="-1" role="status" aria-live="polite"></div>
<noscript><p class="satact-noscript">Turn on JavaScript to check your answer. The written solution below shows the answer and every step.</p></noscript>
</section>
<section id="satact-video" class="satact-video" aria-labelledby="satact-video-title" hidden>
<h2 id="satact-video-title">Video Explanation</h2>
<div class="satact-video-body" id="satact-video-body"></div>
</section>
<section class="satact-solution-section" aria-labelledby="satact-solution-title">
<h2 id="satact-solution-title">Written Solution</h2>
<details class="satact-solution" id="satact-solution">
<summary><span class="satact-summary-closed">Show the step-by-step solution</span><span class="satact-summary-open">Hide the step-by-step solution</span></summary>
<div class="satact-solution-body">
${yourAnswer}
<ol class="satact-steps">
${r.solution.steps.map(solutionStep).join('\n')}
</ol>
<div class="satact-answer-box"><h3>Answer</h3><p>${typed ? '' : `<strong>${r.answer.label}</strong> · `}${inline(r.answer.display)}</p></div>
<div class="satact-key-idea"><h3>Key Idea</h3><p>${inline(r.solution.keyIdea)}</p></div>
${wrong.length ? `<details class="satact-wrong-choices">
<summary>Why the other choices are wrong</summary>
<ul>
${wrong.map(c => `<li><strong>${c.label}</strong> · ${inline(c.display)}: ${inline(c.why)}</li>`).join('\n')}
</ul>
</details>` : ''}
</div>
</details>
</section>
</article>
<section id="satact-summary" class="satact-summary" aria-labelledby="satact-summary-title" tabindex="-1" hidden></section>
<nav class="satact-problem-nav" aria-labelledby="more-practice-title">
<h2 id="more-practice-title">More Practice</h2>
<ul>
<li><a href="${p.subject.url}">More ${esc(p.subject.label)} questions</a></li>
<li><a href="${SECTION}">SAT &amp; ACT Math Practice home</a></li>
<li><a href="${SECTION}problems/">All numbered questions</a></li>
${prev ? `<li><a href="${prev.url}">Previous: #${prev.displayNumber} ${esc(prev.title)}</a></li>` : ''}
${next ? `<li><a href="${next.url}">Next: #${next.displayNumber} ${esc(next.title)}</a></li>` : ''}
</ul>
</nav>
<script type="application/json" id="satact-problem-data">${problemData(p, next)}</script>`;
  return shell({
    pageTitle: `#${p.displayNumber}: ${p.title} | SAT & ACT Math | BatchMath`,
    description: `SAT and ACT math practice question #${p.displayNumber} (${p.skill.label}): ${p.title}. Answer choices, instant feedback and a step-by-step written solution.`,
    page: 'problem', body, math: true
  });
}

// ---------------------------------------------------------------- catalog
function catalogJs() {
  const catalog = {
    schema: 'batchmath.sat-act.catalog/1',
    contentStatus: lib.contentStatus,
    section: SECTION,
    problems: lib.problems.map(p => ({
      id: p.id,
      number: p.number,
      displayNumber: p.displayNumber,
      url: p.url,
      title: p.title,
      subject: p.subject.slug,
      skill: p.skill.id,
      exams: p.exams,
      difficulty: p.difficulty.value,
      format: p.record.format,
      hasVideo: p.hasVideo
    })),
    subjects: lib.subjects.map(s => ({ slug: s.slug, label: s.label, url: s.url, skills: s.skills.map(k => k.id) })),
    skills: lib.subjects.flatMap(s => s.skills.map(k => ({ id: k.id, label: k.label, subject: s.slug }))),
    difficulties: lib.difficulties.map(d => ({ value: d.value, label: d.label }))
  };
  return `/* BatchMath SAT & ACT Math Practice catalog — generated by tools/sat-act/build-sat-act-pages.mjs. Do not edit. */\nwindow.BM_SAT_ACT_CATALOG = ${JSON.stringify(catalog, null, 1)};\n`;
}

// ---------------------------------------------------------------- build
fs.rmSync(OUT, { recursive: true, force: true });
writePage(SECTION, landingPage());
writePage(`${SECTION}problems/`, problemsIndexPage());
lib.subjects.forEach(s => writePage(s.url, topicPage(s)));
lib.problems.forEach((p, i) => writePage(p.url, problemPage(p, i)));
fs.mkdirSync(path.join(ROOT, 'assets/sat-act'), { recursive: true });
fs.writeFileSync(path.join(ROOT, 'assets/sat-act/catalog.js'), catalogJs());
const pages = 2 + lib.subjects.length + lib.problems.length;
console.log(`SAT & ACT build: ${lib.problems.length} questions, ${lib.subjects.length} topic pages, ${pages} pages (${lib.contentStatus}).`);
if (!process.argv.includes('--no-seo')) {
  execFileSync(process.execPath, [path.join(ROOT, 'tools/seo-build.mjs'), `--only=${SECTION.replace(/^\//, '')}`], { cwd: ROOT, stdio: 'inherit' });
}
