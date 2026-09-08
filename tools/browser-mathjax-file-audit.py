import asyncio,re,json,html as htmlmod
from pathlib import Path
from playwright.async_api import async_playwright
ROOT=Path('/mnt/data/bm_v1063n_full')
TMP=Path('/mnt/data/bm_v1063n_fileaudit'); TMP.mkdir(exist_ok=True)
MJ=Path('/usr/local/slides_js/node_modules/mathjax-full/es5/tex-chtml.js')
PAGES=[]
for p in ROOT.rglob('index.html'):
    try:s=p.read_text(errors='ignore')
    except:continue
    if 'engineId:' in s:PAGES.append(p)
PAGES.sort()
RAW_RE=re.compile(r"\\(?:frac|dfrac|tfrac|sqrt|pi|infty|pm|mp|cup|cap|lt|gt|leq?|geq?|neq|approx|cdot|times|sin|cos|tan|sec|csc|cot|ln|log|arcsin|arccos|arctan|quad|qquad|theta|Delta|partial|begin|end|left|right|displaystyle|to)\b")
BADWORD_RE=re.compile(r"(?<![A-Za-z])(?:frac|qquad|quad)(?![A-Za-z])",re.I)
DELIM_RE=re.compile(r"\\[()\[\]]")
BASE=ROOT.as_uri()+'/'
MJURI=MJ.as_uri()

def transform(p):
    rel=p.relative_to(ROOT)
    s=p.read_text(errors='ignore')
    # Replace site MathJax CDN with local exact-functional bundle available in test environment.
    s=re.sub(r'https://cdn\.jsdelivr\.net/npm/mathjax@4\.1\.3/tex-chtml\.js',MJURI,s)
    # Root-relative local files/links -> absolute file URIs so actual site JS/CSS loads.
    s=s.replace('src="/','src="'+BASE).replace("src='/","src='"+BASE)
    s=s.replace('href="/','href="'+BASE).replace("href='/","href='"+BASE)
    # Disable analytics network load only; it does not affect practice rendering.
    s=re.sub(r'<script async src="https://www\.googletagmanager\.com/gtag/js\?id=[^"]+"></script>','',s)
    out=TMP/rel; out.parent.mkdir(parents=True,exist_ok=True); out.write_text(s)
    return out

async def snap(page):
    d=await page.evaluate('''() => {const roots=[...document.querySelectorAll('#question,#choices,#feedback,.question,.choice-grid,.feedback,.method,.correct-answer,.correct-answer-text')];const uniq=[...new Set(roots)];return {text:uniq.map(x=>x.innerText||'').join('\\n'), merrors:document.querySelectorAll('mjx-merror').length, mjx:document.querySelectorAll('mjx-container').length}}''')
    t=d['text'];bad=[]
    if RAW_RE.search(t):bad.append('raw TeX command visible')
    if DELIM_RE.search(t):bad.append('raw MathJax delimiter visible')
    if BADWORD_RE.search(t):bad.append('dropped TeX command word visible')
    if re.search(r'\bNaN\b',t):bad.append('NaN visible')
    if re.search(r'\bundefined\b',t,re.I):bad.append('undefined visible')
    if d['merrors']:bad.append(f"{d['merrors']} MathJax merror node(s)")
    return d,bad

async def interact(page):
    choices=page.locator('#choices button.choice:not([disabled]), .choice-grid button.choice:not([disabled]), button.answer-choice:not([disabled]), button.choice:not([disabled])')
    n=await choices.count()
    if n:
      try:
        await choices.nth(0).click(timeout=1000,force=True)
        submit=page.locator('#submit:not([disabled])')
        if await submit.count() and await submit.first.is_visible():await submit.first.click(timeout=800,force=True)
      except:pass
    else:
      for sel in ['#numeric-answer','#answer','#user-answer','#approx-answer','#stage2-answer','#location-input','input.practice-answer-input','input[type="text"]']:
        loc=page.locator(sel)
        if await loc.count():
          try:
            if await loc.first.is_visible() and await loc.first.is_enabled():
              await loc.first.fill('999999')
              sub=page.locator('#submit:not([disabled]), button:has-text("Check Answer"), button:has-text("Check")')
              if await sub.count() and await sub.first.is_visible():await sub.first.click(timeout=800,force=True)
              else: await loc.first.press('Enter')
              break
          except:pass
    await page.wait_for_timeout(80)
    try:await page.evaluate('window.MathJax?.typesetPromise ? MathJax.typesetPromise() : Promise.resolve()')
    except:pass
    await page.wait_for_timeout(60)

async def nextp(page):
    for sel in ['#next:not([hidden]):not([disabled])','button:has-text("Next Question")','button:has-text("Next Problem")','button:has-text("New Problem")']:
      loc=page.locator(sel)
      if await loc.count():
        try:
          if await loc.first.is_visible() and await loc.first.is_enabled():await loc.first.click(timeout=800,force=True);await page.wait_for_timeout(80);return True
        except:pass
    return False

async def main():
  errors=[];page_errors=[];snaps=0;feedback=0;mjxs=0
  async with async_playwright() as p:
    b=await p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-gpu','--allow-file-access-from-files'])
    ctx=await b.new_context(service_workers='block')
    page=await ctx.new_page(); cur=['']
    page.on('pageerror',lambda e:page_errors.append(f"{cur[0]}: {e}"))
    for idx,pth in enumerate(PAGES,1):
      rel=pth.relative_to(ROOT).as_posix();cur[0]=rel;tp=transform(pth)
      try:
        await page.goto(tp.as_uri(),wait_until='domcontentloaded',timeout=7000);await page.wait_for_timeout(150)
        try:await page.wait_for_function('!window.MathJax || !!window.MathJax.typesetPromise',timeout=3000)
        except:pass
        try:await page.evaluate('window.MathJax?.typesetPromise ? MathJax.typesetPromise() : Promise.resolve()')
        except:pass
        for cycle in range(4):
          d,bad=await snap(page);snaps+=1;mjxs+=d['mjx']
          if bad:errors.append({'page':rel,'cycle':cycle+1,'stage':'question/choices','bad':bad,'text':d['text'][:1400]})
          await interact(page)
          d,bad=await snap(page);snaps+=1;mjxs+=d['mjx'];feedback+=1 if (await page.locator('#feedback,.feedback').count()) else 0
          if bad:errors.append({'page':rel,'cycle':cycle+1,'stage':'feedback','bad':bad,'text':d['text'][:1400]})
          if cycle<3 and not await nextp(page):
            await page.reload(wait_until='domcontentloaded',timeout=7000);await page.wait_for_timeout(120)
        if idx%10==0:print('audited',idx,'/',len(PAGES))
      except Exception as e:errors.append({'page':rel,'cycle':0,'stage':'load/interact','bad':[type(e).__name__+': '+str(e)],'text':''})
    await b.close()
  serious=[x for x in page_errors if not re.search(r'(service worker|Failed to fetch|NetworkError|NotSupportedError|SecurityError|Access to fetch)',x,re.I)]
  rep={'ok':not errors and not serious,'engines':len(PAGES),'browser_snapshots':snaps,'feedback_checks':feedback,'mathjax_containers_seen':mjxs,'errors':errors,'page_errors':serious,'mathjax_test_version':'3.2.1 local bundle; site release pins 4.1.3'}
  out=ROOT/'qa-results/browser-mathjax-file-audit.json';out.write_text(json.dumps(rep,indent=2))
  print(json.dumps({k:v for k,v in rep.items() if k not in ('errors','page_errors')},indent=2));print('errors',len(errors),'page_errors',len(serious))
  for e in errors[:20]:print('ERR',e['page'],e['cycle'],e['stage'],e['bad'])
  for e in serious[:10]:print('PAGEERR',e)
  raise SystemExit(0 if rep['ok'] else 1)
asyncio.run(main())
