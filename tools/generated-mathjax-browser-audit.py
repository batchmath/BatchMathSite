import asyncio,json,re,html
from pathlib import Path
from playwright.async_api import async_playwright
ROOT=Path('/mnt/data/bm_v1063n_full')
MJ=Path('/usr/local/slides_js/node_modules/mathjax-full/es5/tex-chtml.js').read_text(errors='ignore')
RAW_RE=re.compile(r"\\(?:frac|dfrac|tfrac|sqrt|pi|infty|pm|mp|cup|cap|lt|gt|leq?|geq?|neq|approx|cdot|times|sin|cos|tan|sec|csc|cot|ln|log|arcsin|arccos|arctan|quad|qquad|theta|Delta|partial|begin|end|left|right|displaystyle|to)\b")
DELIM_RE=re.compile(r"\\[()\[\]]")
BADWORD_RE=re.compile(r"(?<![A-Za-z])(?:frac|qquad|quad)(?![A-Za-z])",re.I)
MATHLIKE_RE=re.compile(r"\\[A-Za-z]+|[=<>≤≥±∞π^_]|^\s*[xyft]\s*(?:=|<|>|≤|≥)|^\s*\(?[-+]?\d")

def load_samples():
    out=[]
    D=json.load(open(ROOT/'qa-results/ap-topic-deep-audit.json'))
    for t in D['topics']:
        for p in t.get('reviewSamples',[])[:40]: out.append(('AP:'+t['slug'],p))
    
    prep=json.load(open(ROOT/'qa-results/calc-prep-render-samples.json'))
    seen={}
    for x in prep:
        e=x['engine']; seen[e]=seen.get(e,0)+1
        if seen[e]<=50: out.append(('Prep:'+e,x['problem']))
    
    im1=json.load(open(ROOT/'qa-results/im1-render-samples.json'))
    seen={}
    for x in im1:
        e=x['engine']; seen[e]=seen.get(e,0)+1
        if seen[e]<=50: out.append(('IM1:'+e,x['problem']))
    return out

def strings_from(obj,path=''):
    vals=[]
    if isinstance(obj,str): vals.append((path,obj))
    elif isinstance(obj,list):
        for i,v in enumerate(obj): vals.extend(strings_from(v,f'{path}[{i}]'))
    elif isinstance(obj,dict):
        for k,v in obj.items():
            if k.lower() in {'id','key','slug','variant','problemtype','problemvariant','kind','cat','type'}: continue
            vals.extend(strings_from(v,f'{path}.{k}' if path else k))
    return vals

def render_field(path,s):
    # Match the site's main behavior: HTML-bearing fields are inserted as HTML;
    # choices that look mathematical are wrapped in inline MathJax; prose remains text.
    low=path.lower(); is_choice='choice' in low or 'answer' in low or 'correct' in low
    has_html=bool(re.search(r'<[A-Za-z][^>]*>',s))
    delimited='\\(' in s or '\\[' in s
    if has_html or delimited or any(x in low for x in ['explanation','method','sol','questionhtml','answerhtml']):
        content=s
    elif low.endswith('tex') or low.endswith('.tex') or low in {'tex','math'}:
        content='\\('+s+'\\)'
    elif is_choice and MATHLIKE_RE.search(s):
        content='\\('+s+'\\)'
    else:
        content=html.escape(s)
    return f'<div class="field" data-path="{html.escape(path)}">{content}</div>'

NORMALIZE_JS=r'''() => {
 const rawTexCommandRE=/\\(?:frac|dfrac|tfrac|sqrt|pi|infty|pm|mp|cup|cap|lt|gt|leq?|geq?|neq|approx|cdot|times|sin|cos|tan|sec|csc|cot|ln|log|arcsin|arccos|arctan|quad|qquad|theta|Delta|partial|to)\b/;
 function balanced(s,start,open,close){let d=0;for(let i=start;i<s.length;i++){if(s[i]===open)d++;else if(s[i]===close){d--;if(d===0)return i+1;}}return start;}
 function cmdEnd(s,i){const m=s.slice(i).match(/^\\([A-Za-z]+)/);if(!m)return i+1;let j=i+m[0].length,name=m[1];if(['frac','dfrac','tfrac'].includes(name)){if(s[j]==='{')j=balanced(s,j,'{','}');if(s[j]==='{')j=balanced(s,j,'{','}');return j;}if(name==='sqrt'){if(s[j]==='['){const q=s.indexOf(']',j+1);if(q>=0)j=q+1;}if(s[j]==='{')j=balanced(s,j,'{','}');return j;}if(['sin','cos','tan','sec','csc','cot','ln','log','arcsin','arccos','arctan'].includes(name)){while(j<s.length&&/\s/.test(s[j]))j++;if(s[j]==='(')j=balanced(s,j,'(',')');else while(j<s.length&&/[A-Za-z0-9_^{}+\-*/.]/.test(s[j]))j++;return j;}return j;}
 function wrapRaw(text){if(!rawTexCommandRE.test(text))return text;const slots=[];let src=text.replace(/\\\([\s\S]*?\\\)|\\\[[\s\S]*?\\\]/g,m=>{slots.push(m);return `@@BMMATH${slots.length-1}@@`;});let out='',i=0;while(i<src.length){const m=src.slice(i).match(/\\(?:frac|dfrac|tfrac|sqrt|pi|infty|pm|mp|cup|cap|lt|gt|leq?|geq?|neq|approx|cdot|times|sin|cos|tan|sec|csc|cot|ln|log|arcsin|arccos|arctan|quad|qquad|theta|Delta|partial|to)\b/);if(!m){out+=src.slice(i);break;}const st=i+m.index;out+=src.slice(i,st);const en=cmdEnd(src,st);out+=`\\(${src.slice(st,en)}\\)`;i=en;}return out.replace(/@@BMMATH(\d+)@@/g,(_,n)=>slots[+n]);}
 const walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);const nodes=[];while(walker.nextNode())nodes.push(walker.currentNode);for(const n of nodes){if(n.parentElement?.closest('mjx-container,script,style,textarea'))continue;const v=n.nodeValue||'',next=wrapRaw(v);if(next!==v)n.nodeValue=next;}
}'''

async def main():
    samples=load_samples(); errors=[]; total_fields=0; mjx=0; batches=0
    async with async_playwright() as p:
        b=await p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-gpu'])
        page=await b.new_page()
        await page.set_content('<!doctype html><html><head></head><body></body></html>')
        await page.add_script_tag(content='window.MathJax={tex:{inlineMath:[["\\\\(","\\\\)"],["$","$"]]},options:{enableMenu:false}};')
        await page.add_script_tag(content=MJ)
        await page.wait_for_function('window.MathJax && window.MathJax.typesetPromise')
        for start in range(0,len(samples),160):
            batch=samples[start:start+160]; chunks=[]
            for idx,(label,obj) in enumerate(batch):
                fields=strings_from(obj); total_fields+=len(fields)
                fhtml=''.join(render_field(path,s) for path,s in fields)
                chunks.append(f'<section class="sample" data-label="{html.escape(label)}" data-index="{start+idx}">{fhtml}</section>')
            await page.evaluate('(h)=>{document.body.innerHTML=h}', ''.join(chunks))
            await page.evaluate(NORMALIZE_JS)
            try: await page.evaluate('MathJax.typesetPromise([document.body])')
            except Exception as e: errors.append({'batch':start,'error':'typesetPromise '+str(e)})
            await page.wait_for_timeout(1)
            mjx += await page.locator('mjx-container').count()
            merrors=await page.locator('mjx-merror').count()
            if merrors:
                errors.append({'batch':start,'error':f'{merrors} MathJax merror nodes'})
            bads=await page.evaluate('''() => [...document.querySelectorAll('.sample')].map(s=>({label:s.dataset.label,index:s.dataset.index,text:s.innerText||''})).filter(x=>/\\\\(?:frac|dfrac|tfrac|sqrt|pi|infty|pm|mp|cup|cap|lt|gt|leq?|geq?|neq|approx|cdot|times|sin|cos|tan|sec|csc|cot|ln|log|arcsin|arccos|arctan|quad|qquad|theta|Delta|partial|begin|end|left|right|displaystyle|to)\\b|\\\\[()\\[\\]]|\\bNaN\\b|(^|[^A-Za-z])(frac|qquad|quad)([^A-Za-z]|$)/im.test(x.text))''')
            for x in bads[:50]: errors.append({'sample':x['index'],'label':x['label'],'error':'visible raw/bad math token','text':x['text'][:1000]})
            batches+=1
        await b.close()
    by={'AP':0,'Prep':0,'IM1':0}
    for label,_ in samples: by[label.split(':')[0]]+=1
    report={'ok':not errors,'samples':len(samples),'sample_counts':by,'fields_rendered':total_fields,'mathjax_containers_seen':mjx,'batches':batches,'errors':errors,'browser':'Chromium headless','mathjax_runtime':'local MathJax 3.2.1 compatibility renderer; production site pins 4.1.3'}
    (ROOT/'qa-results/generated-mathjax-browser-audit.json').write_text(json.dumps(report,indent=2))
    print(json.dumps({k:v for k,v in report.items() if k!='errors'},indent=2));print('errors',len(errors))
    for e in errors[:20]:print('ERR',e)
    raise SystemExit(0 if report['ok'] else 1)
asyncio.run(main())
