import asyncio, re, json
from pathlib import Path
from playwright.async_api import async_playwright, TimeoutError as PWTimeout

ROOT=Path('/mnt/data/bm_v1063n_full')
BASE='http://127.0.0.1:8765/'
MATHJAX=Path('/usr/local/slides_js/node_modules/mathjax-full/es5/tex-chtml.js').read_text(errors='ignore')
PAGES=[]
for p in ROOT.rglob('index.html'):
    try:s=p.read_text(errors='ignore')
    except:continue
    if 'engineId:' in s:
        PAGES.append(p.relative_to(ROOT).as_posix())
PAGES.sort()

RAW_RE=re.compile(r"\\(?:frac|dfrac|tfrac|sqrt|pi|infty|pm|mp|cup|cap|lt|gt|leq?|geq?|neq|approx|cdot|times|sin|cos|tan|sec|csc|cot|ln|log|arcsin|arccos|arctan|quad|qquad|theta|Delta|partial|begin|end|left|right|displaystyle|to)\b")
BADWORD_RE=re.compile(r"(?<![A-Za-z])(?:frac|qquad|quad)(?![A-Za-z])",re.I)
DELIM_RE=re.compile(r"\\[()\[\]]")

async def text_and_bad(page):
    data=await page.evaluate('''() => {
      const roots=[...document.querySelectorAll('#question,#choices,#feedback,.question,.choice-grid,.feedback,.method,.correct-answer,.correct-answer-text')];
      const uniq=[...new Set(roots)];
      return {text:uniq.map(x=>x.innerText||'').join('\\n'), merrors:document.querySelectorAll('mjx-merror').length, mjx:document.querySelectorAll('mjx-container').length};
    }''')
    text=data['text']
    bad=[]
    if RAW_RE.search(text): bad.append('raw TeX command visible')
    if DELIM_RE.search(text): bad.append('raw MathJax delimiter visible')
    if BADWORD_RE.search(text): bad.append('dropped TeX command word visible')
    if re.search(r'\bNaN\b',text): bad.append('NaN visible')
    if data['merrors']: bad.append(f"{data['merrors']} MathJax merror node(s)")
    return data,bad

async def interact_once(page):
    # Prefer answer choices. Many AP engines give immediate feedback; Calc Prep often needs Submit.
    choices=page.locator('#choices button.choice:not([disabled]), .choice-grid button.choice:not([disabled]), button.answer-choice:not([disabled]), button.choice:not([disabled])')
    try:
        n=await choices.count()
    except: n=0
    if n:
        try:
            await choices.nth(0).click(timeout=1000, force=True)
            submit=page.locator('#submit:not([disabled])')
            if await submit.count() and await submit.first.is_visible():
                await submit.first.click(timeout=1000, force=True)
        except: pass
    else:
        # Numeric/text response engines.
        candidates=['#numeric-answer','#answer','#user-answer','#approx-answer','#stage2-answer','#location-input','input.practice-answer-input']
        inp=None
        for sel in candidates:
            loc=page.locator(sel)
            if await loc.count():
                try:
                    if await loc.first.is_visible() and await loc.first.is_enabled(): inp=loc.first;break
                except: pass
        if inp is not None:
            try:
                await inp.fill('999999')
                submit=page.locator('#submit:not([disabled]), button:has-text("Check Answer"), button:has-text("Check")')
                if await submit.count() and await submit.first.is_visible(): await submit.first.click(timeout=1000, force=True)
                else: await inp.press('Enter')
            except: pass
    await page.wait_for_timeout(120)
    try:
        await page.evaluate("window.MathJax?.typesetPromise ? MathJax.typesetPromise() : Promise.resolve()")
    except: pass
    await page.wait_for_timeout(80)

async def next_problem(page):
    sels=['#next:not([hidden]):not([disabled])','button:has-text("Next Question")','button:has-text("Next Problem")','button:has-text("New Problem")']
    for sel in sels:
        loc=page.locator(sel)
        if await loc.count():
            try:
                if await loc.first.is_visible() and await loc.first.is_enabled():
                    await loc.first.click(timeout=1000, force=True); await page.wait_for_timeout(120); return True
            except: pass
    return False

async def main():
    errors=[]; page_errors=[]; samples=0; feedback_seen=0; mjx_total=0
    async with async_playwright() as p:
        browser=await p.chromium.launch(headless=True, executable_path='/usr/bin/chromium', args=['--no-sandbox','--disable-gpu'])
        ctx=await browser.new_context(service_workers='block')
        async def route_handler(route):
            url=route.request.url
            if 'mathjax' in url.lower() and url.endswith('tex-chtml.js'):
                await route.fulfill(status=200,content_type='application/javascript',body=MATHJAX)
            elif url.startswith('https://cdn.jsdelivr.net/'):
                await route.abort()
            else:
                await route.continue_()
        await ctx.route('**/*',route_handler)
        page=await ctx.new_page()
        current=['']
        page.on('pageerror',lambda e: page_errors.append(f"{current[0]}: {e}"))
        for idx,rel in enumerate(PAGES,1):
            current[0]=rel
            url=BASE+rel[:-10] if rel.endswith('index.html') else BASE+rel
            try:
                await page.goto(url,wait_until='domcontentloaded',timeout=7000)
                await page.wait_for_timeout(180)
                try: await page.wait_for_function("!window.MathJax || !!window.MathJax.typesetPromise",timeout=2500)
                except: pass
                try: await page.evaluate("window.MathJax?.typesetPromise ? MathJax.typesetPromise() : Promise.resolve()")
                except: pass
                for cycle in range(3):
                    await page.wait_for_timeout(80)
                    data,bad=await text_and_bad(page); samples+=1;mjx_total+=data['mjx']
                    if bad: errors.append({'page':rel,'cycle':cycle+1,'stage':'question/choices','bad':bad,'text':data['text'][:1200]})
                    await interact_once(page)
                    data,bad=await text_and_bad(page); samples+=1;mjx_total+=data['mjx']
                    if (await page.locator('#feedback,.feedback').count()): feedback_seen+=1
                    if bad: errors.append({'page':rel,'cycle':cycle+1,'stage':'feedback','bad':bad,'text':data['text'][:1200]})
                    if cycle<2:
                        if not await next_problem(page):
                            await page.reload(wait_until='domcontentloaded',timeout=7000); await page.wait_for_timeout(180)
                if idx%10==0: print(f"audited {idx}/{len(PAGES)} engines")
            except Exception as e:
                errors.append({'page':rel,'cycle':0,'stage':'load/interact','bad':[type(e).__name__+': '+str(e)],'text':''})
        await browser.close()
    # Filter harmless page errors commonly caused by blocked service workers/resources.
    serious_page_errors=[x for x in page_errors if not re.search(r'(service worker|Failed to fetch|NetworkError)',x,re.I)]
    report={'ok':not errors and not serious_page_errors,'engines':len(PAGES),'browser_snapshots':samples,'feedback_checks':feedback_seen,'mathjax_containers_seen':mjx_total,'errors':errors,'page_errors':serious_page_errors}
    out=ROOT/'qa-results'/'browser-mathjax-audit.json';out.parent.mkdir(exist_ok=True);out.write_text(json.dumps(report,indent=2))
    print(json.dumps({k:v for k,v in report.items() if k not in ('errors','page_errors')},indent=2));print('errors',len(errors),'page_errors',len(serious_page_errors))
    if errors:
        for e in errors[:30]: print('ERR',e['page'],e['cycle'],e['stage'],e['bad'])
    if serious_page_errors:
        for e in serious_page_errors[:20]:print('PAGEERR',e)
    raise SystemExit(0 if report['ok'] else 1)

asyncio.run(main())
