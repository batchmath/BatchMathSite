// HISTORICAL builder for the Integrated Math 1 Unit 3 pages. The published pages have since gained SEO metadata,
// breadcrumbs, structured data and newer practice markup outside this script, so a full rebuild would remove them. It
// therefore refuses to run unless --legacy-rebuild is given. To change Unit 3 navigation or labels, edit
// tools/im1-nav/structure.mjs and run `node tools/im1-nav/apply.mjs` instead (docs/IM1-NAVIGATION-STANDARD.md).
// Every visible label here also comes from that structure: sections "Section 1 — Arithmetic Sequences", parts
// "1A — Identifying Arithmetic Sequences". The `code` below (01A ...) is only the PDF file-name prefix.
import fs from 'node:fs';
import path from 'node:path';
import {withInstructionalVideo} from './v13-im1-videos/markup.mjs';
import {UNITS, pageInfo, sectionLabel, partLabel, topicSelect, sectionCards, unitCards, pager as topicPager} from './im1-nav/structure.mjs';

if (process.argv && !process.argv.includes('--legacy-rebuild')) { // (tools/v13g-im1-videos/source-qa.mjs runs it sandboxed, without argv or file writes)
 console.error('Refusing to overwrite the Unit 3 pages: this historical builder predates their current SEO, breadcrumb and practice markup.\nUse `node tools/im1-nav/apply.mjs` for navigation and labels, or pass --legacy-rebuild to rebuild anyway.');
 process.exit(1);
}
const U3=UNITS.find(u=>u.n===3);

const root=process.cwd();
const unitRel='im1/unit-3-linear-equation';
const unitDir=path.join(root,unitRel);

const categories=[
 {key:'a',slug:'a-arithmetic-sequences-and-arithmetic-progression-models',title:'Section 1 — Arithmetic Sequences',description:'Recognize and extend arithmetic sequences, write explicit formulas, find terms and term numbers, and model situations with constant change.'},
 {key:'b',slug:'b-functions-function-notation-and-slope',title:'Section 2 — Functions, Function Notation, and Slope',description:'Evaluate and solve function equations, calculate slope from points and graphs, and use slope to decide whether points are collinear.'},
 {key:'c',slug:'c-slope-intercept-form-and-point-slope-form',title:'Section 3 — Slope-Intercept and Point-Slope Form',description:'Read, write, and convert linear equations and use them to model real situations.'},
 {key:'d',slug:'d-recursive-formulas-for-linear-relationships',title:'Section 4 — Recursive Formulas for Linear Relationships',description:'Write recursive formulas, generate terms, convert to explicit formulas, and determine a common difference from known terms.'}
];
const topics=[
 ['01A','a','identifying-arithmetic-sequences','Identifying Arithmetic Sequences','Determine whether a sequence has a constant difference and identify that common difference.'],
 ['01B','a','common-difference-next-terms','Common Difference and Next Terms','Find the common difference and extend an arithmetic sequence by three terms.'],
 ['01C','a','explicit-formulas-arithmetic-sequences','Explicit Formulas for Arithmetic Sequences','Use a first term and common difference to write an explicit formula and generate terms.'],
 ['01D','a','finding-a-specific-term','Finding a Specific Term','Use an arithmetic-sequence formula to calculate a requested term.'],
 ['01E','a','finding-the-term-number','Finding the Term Number','Solve an arithmetic-sequence equation to identify where a given value occurs.'],
 ['01F','a','arithmetic-sequence-word-problems','Arithmetic Sequence Word Problems','Model constant-change situations with arithmetic sequences and answer questions about later terms.'],
 ['01G','a','section-a-review','Section 1 Review','Mixed review of all Arithmetic Sequences skills.'],
 ['02A','b','evaluating-functions','Evaluating Functions','Substitute an input into linear and quadratic function rules.'],
 ['02B','b','solving-function-equations','Solving Function Equations','Solve for an input when a function output is known.'],
 ['02C','b','slope-from-two-points','Slope from Two Points','Calculate rise over run from two ordered pairs.'],
 ['02D','b','collinearity-and-slope','Collinearity and Slope','Compare slopes to determine whether points lie on the same line.'],
 ['02E','b','slope-from-graphs','Slope from Graphs','Read two lattice points from a graph and calculate the line’s slope.'],
 ['02F','b','section-b-review','Section 2 Review','Mixed review of function notation, equations, slope, graphs, and collinearity.'],
 ['03A','c','slope-intercept-form','Slope-Intercept Form','Identify slope and y-intercept and write equations in slope-intercept form.'],
 ['03B','c','writing-equations-of-lines','Writing Equations of Lines','Write slope-intercept and point-slope equations from points and slopes.'],
 ['03C','c','converting-point-slope-to-slope-intercept','Converting Point-Slope to Slope-Intercept Form','Distribute and isolate y to convert a point-slope equation.'],
 ['03D','c','linear-function-word-problems','Linear Function Word Problems','Translate a starting value and constant rate into a linear function.'],
 ['03E','c','section-c-review','Section 3 Review','Mixed review of slope-intercept form, point-slope form, conversions, and modeling.'],
 ['04A','d','recursive-formulas-from-sequences','Recursive Formulas from Sequences','Write recursive rules, generate sequence terms, and interpret the common difference.'],
 ['04B','d','recursive-to-explicit-formulas','Recursive to Explicit Formulas','Convert arithmetic recursive rules into explicit formulas.'],
 ['04C','d','common-difference-recursive-formulas','Common Difference and Recursive Formulas','Use two known terms to find the common difference and write a recursive rule.'],
 ['04D','d','section-d-review','Section 4 Review','Mixed review of recursive arithmetic-sequence skills.'],
 ['05','review','unit-3-comprehensive-review','Unit 3 Comprehensive Review','Cumulative practice across arithmetic sequences, functions and slope, linear equations, modeling, and recursive formulas.']
].map(([code,category,slug,title,description])=>({code,category,slug,title,description}));

for(const [i,c] of categories.entries())c.title=sectionLabel(U3.sections[i]);
for(const t of topics){if(t.category==='review')continue;const part=U3.sections.flatMap(x=>x.topics).find(x=>x.slug===t.slug)?.parts[0];if(!part)throw new Error(`${t.slug} is not in tools/im1-nav/structure.mjs`);t.title=partLabel(part);}
const lessonsByCategory=Object.fromEntries(categories.map(c=>[c.key,topics.filter(t=>t.category===c.key)]));
const reviewOptions={
 'section-a-review':lessonsByCategory.a.slice(0,-1),
 'section-b-review':lessonsByCategory.b.slice(0,-1),
 'section-c-review':lessonsByCategory.c.slice(0,-1),
 'section-d-review':lessonsByCategory.d.slice(0,-1)
};
const fileBase=t=>`${t.code.toLowerCase()}-${t.slug}`;
const topicUrl=t=>t.category==='review'?`/im1/unit-3-linear-equation/topics/comprehensive-review/`:`/im1/unit-3-linear-equation/topics/${categories.find(c=>c.key===t.category).slug}/${t.slug}/`;
const escape=s=>s.replaceAll('&','&amp;').replaceAll('’','&#8217;');

function head(title,description,canonical){return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><link rel="icon" href="/favicon.ico" sizes="any"><link rel="icon" type="image/svg+xml" href="/favicon.svg"><link rel="icon" type="image/png" sizes="32x32" href="/favicon-32.png"><link rel="apple-touch-icon" href="/apple-touch-icon.png"><meta name="description" content="${escape(description)}"><link rel="canonical" href="https://batchmath.net${canonical}"><meta property="og:site_name" content="BatchMath"><meta property="og:type" content="website"><meta property="og:title" content="${escape(title)}"><meta property="og:description" content="${escape(description)}"><meta property="og:url" content="https://batchmath.net${canonical}"><meta property="og:image" content="https://batchmath.net/assets/batchmath-social-card-v1.png"><meta name="twitter:card" content="summary_large_image"><title>${escape(title)}</title><link rel="stylesheet" href="/assets/site.css" data-batchmath-shared-style="v10.0"><link rel="stylesheet" href="/assets/im1-unit3.css"><link rel="manifest" href="/manifest.webmanifest"><meta name="theme-color" content="#030303"><script src="/assets/batchmath-storage.js" defer></script><script src="/assets/answer-normalization.js"></script><script src="/assets/pwa.js" defer></script><script async src="https://www.googletagmanager.com/gtag/js?id=G-377MTFXSF3"></script><script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','G-377MTFXSF3');</script>`;}
function header(){return `<body><a class="skip-link" href="#main-content">Skip to main content</a><header class="topbar"><img class="corner" src="/assets/batchmath-portrait.jpg" alt=""><a class="logo" href="/">BatchMath<span class="tm-mark">™</span></a><div class="profile"><img src="/assets/batchmath-portrait.jpg" alt="BatchMath"><button class="menu-toggle" type="button" aria-expanded="false" aria-haspopup="true" aria-controls="course-menu">COURSES ▼</button><nav id="course-menu" class="dropdown"><a href="/im1/" class="current-section" aria-current="page">Integrated Math 1</a><a href="/calculus-prep/">Calculus Prep</a><a href="/ap-calculus/">AP Calculus AB</a><a href="/about/">About</a><a href="/">Home</a></nav></div></header>`;}
function footer(){return `<footer class="footer"><div class="bm-footer-main">© 2026 BatchMath. All rights reserved. BatchMath™.</div><div class="bm-footer-links"><a href="/about/">About BatchMath</a></div><div class="bm-legal-note">AP® is a trademark registered by the College Board, which is not affiliated with, and does not endorse, this website.</div></footer><script src="/assets/im1-unit3-nav.js"></script></body></html>`;}
const topicOf=slug=>U3.sections.flatMap(x=>x.topics).find(x=>x.slug===slug);
const relFor=t=>`${topicUrl(t).slice(1)}index.html`;
function write(rel,content){const file=path.join(root,rel);fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,content);}

function unitPage(){
 const description='Integrated Math 1 Unit 3 assignments, answer keys, and interactive practice for arithmetic sequences, function notation, slope, linear equations, modeling, and recursive formulas.';
 return `${head('Unit 3 - Linear | Integrated Math 1 | BatchMath',description,'/im1/unit-3-linear-equation/')}</head>${header()}<main id="main-content" class="main"><a class="back" href="/im1/">← Integrated Math 1</a><h1 class="page-title">Unit 3 - Linear</h1><p class="topic-description">Arithmetic sequences, functions and slope, equations of lines, linear modeling, and recursive formulas.</p>${topicSelect(U3,'/im1/unit-3-linear-equation/',null)}${unitCards(U3)}</main>${footer()}`;
}
function categoryPage(category){
 const s=U3.sections.find(x=>x.slug===category.slug),info=pageInfo(`im1/unit-3-linear-equation/topics/${category.slug}/index.html`);
 return `${head(info.title,category.description,info.route)}</head>${header()}<main id="main-content" class="main"><a class="back" href="../../">← Unit 3 - Linear</a><h1 class="page-title">${info.h1}</h1><p class="topic-description">${category.description}</p>${topicSelect(U3,info.route,null)}${sectionCards(U3,s)}</main>${footer()}`;
}
function topicPage(topic){
 const category=categories.find(c=>c.key===topic.category),isReview=topic.category==='review',base=fileBase(topic),assignment=`${base}.pdf`,key=`${base}-answer-key.pdf`;
 const info=pageInfo(relFor(topic));
 const backHref=isReview?'../../':'../',backText=isReview?'Unit 3 - Linear':category.title;
 const resourcePrefix=isReview?'../../resources':'../../../resources';
 const pager=topicPager(U3,topicUrl(topic));
 return withInstructionalVideo(`${head(info.title,topic.description,topicUrl(topic))}</head>${header()}<main id="main-content" class="main"><a class="back" href="${backHref}">← ${backText}</a><h1 class="page-title">${info.h1||topic.title}</h1><p class="topic-description">${topic.description}</p>${topicSelect(U3,topicUrl(topic),isReview?'review':topicOf(topic.slug))}<section class="resource-section"><div class="resource-list"><div class="resource-item"><div class="resource-title">${topic.title}</div><div class="resource-actions"><a class="resource-link" data-bm-resource="assignment" href="${resourcePrefix}/assignments/${assignment}" target="_blank" rel="noopener">Assignment PDF</a><a class="resource-link key" data-bm-resource="answer-key" href="${resourcePrefix}/answer-keys/${key}" target="_blank" rel="noopener">Answer Key PDF</a></div></div></div></section><section class="resource-section" data-bm-topic-practice="1"><div class="resource-actions bm-practice-launch-row"><a class="resource-link bm-practice-launch bm-practice-function" data-bm-resource="practice" href="practice/?from=topic"><span aria-hidden="true" class="bm-practice-icon bm-practice-icon-function">f(x)</span><span class="bm-practice-label">${topic.title} Practice</span><span aria-hidden="true" class="bm-practice-arrow">›</span></a></div></section>${pager}</main>${footer()}`,topic.slug);
}
function focusControl(topic){
 let options=[];
 if(reviewOptions[topic.slug])options=[['mixed','Mixed'],...reviewOptions[topic.slug].map(t=>[t.slug,t.title])];
 else if(topic.slug==='unit-3-comprehensive-review')options=[['mixed','Mixed - Full Unit'],...U3.sections.map((x,i)=>['abcd'[i],sectionLabel(x)])];
 if(!options.length)return'';
 return `<div class="practice-filter"><label for="practiceMode" class="bm-practice-select-label">Practice Type</label><select id="practiceMode" class="bm-practice-select">${options.map(([value,label],i)=>`<option value="${value}"${i===0?' selected':''}>${label}</option>`).join('')}</select></div>`;
}
function practicePage(topic){
 const title=pageInfo(relFor(topic).replace(/index\.html$/,'practice/index.html')).h1,description=`Randomized practice for ${topic.title.toLowerCase()}, modeled on the Unit 3 assignments.`,hasMode=Boolean(reviewOptions[topic.slug]||topic.slug==='unit-3-comprehensive-review');
 return `${head(pageInfo(relFor(topic).replace(/index\.html$/,'practice/index.html')).title,description,`${topicUrl(topic)}practice/`)}<link rel="stylesheet" href="/assets/im1-keypad.css"><link rel="stylesheet" href="/assets/calculus-keypad.css"><script>window.MathJax={tex:{inlineMath:[["\\\\(","\\\\)"]]}};</script><script defer src="https://cdn.jsdelivr.net/npm/mathjax@4.1.3/tex-chtml.js"></script><script src="/assets/reproducible-rng.js"></script><script>window.BM_ANALYTICS_CONFIG={course:"im1",engineId:"im1_unit3_${topic.slug.replaceAll('-','_')}",generatorVersion:"1"};window.BM_UNIT3_PRACTICE={slug:"${topic.slug}"${hasMode?',modeElementId:"practiceMode"':''}};</script><script src="/assets/problem-tracking.js"></script><script src="/assets/im1-unit3-generators.js"></script><script src="/assets/im1-keypad.js" defer></script><script src="/assets/calculus-keypad.js" defer></script><script src="/assets/im1-unit3-practice.js" defer></script></head>${header()}<main id="main-content" class="main"><a class="back" href="../">← Topic Page</a><h1 class="page-title">${title}</h1><p class="topic-description">${description}</p><div class="practice-shell">${focusControl(topic)}<div class="stats"><div class="stat">Correct<span id="score">0</span></div><div class="stat">Attempted<span id="attempted">0</span></div></div><section id="practiceCard" class="question-card"><div id="question" class="question"></div><div id="answerArea" class="question-area"></div><div id="feedback" class="feedback" aria-live="polite"></div><div class="practice-actions"><button id="nextBtn" class="next" type="button" hidden>Next Problem</button><button id="resetBtn" class="reset" type="button">Reset Score</button></div></section></div></main>${footer()}`;
}

write(`${unitRel}/index.html`,unitPage());
for(const category of categories)write(`${unitRel}/topics/${category.slug}/index.html`,categoryPage(category));
for(const topic of topics){
 const rel=topic.category==='review'?`${unitRel}/topics/comprehensive-review`:`${unitRel}/topics/${categories.find(c=>c.key===topic.category).slug}/${topic.slug}`;
 write(`${rel}/index.html`,topicPage(topic));write(`${rel}/practice/index.html`,practicePage(topic));
}
console.log(`Built ${topics.length} Unit 3 topic pages and ${topics.length} practice engines.`);
