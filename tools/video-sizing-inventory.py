"""Inventory actual instructional players, including legacy expandable systems."""
from pathlib import Path
from urllib.parse import urlparse
import re,json,sys,collections,subprocess
sys.path.insert(0,str(Path(__file__).resolve().parent))
from integration.html_tree import Tree
ROOT=Path(__file__).resolve().parents[1]
BASE='98c9beb3c0eb58a952f6bb29e410e63aa280003e'
UNIT6_SOURCE='049e8a49d22f3d5ff67f5a79a855ec0028452ab7'

def inventory():
 pages=[];other=[];deferred=[];counts=collections.Counter();overrides=[]
 for course in ['ap-calculus','im1','calculus-prep']:
  for p in sorted((ROOT/course).rglob('*.html')):
   name=p.relative_to(ROOT).as_posix();s=p.read_text()
   if 'iframe'not in s and 'data-video-id'not in s:continue
   t=Tree(s);rows=[]
   for n in t.root.nodes():
    if 'data-video-id'in n.attrs:
     grid=n.ancestor(lambda a:'data-bm-videos'in a.attrs);card=n.ancestor(lambda a:a.has('video-item'))
     if not grid:raise AssertionError(name+': unclassified video data')
     i=list(c for c in grid.children if c.has('video-item')).index(card);g=list(a for a in t.root.nodes()if'data-bm-videos'in a.attrs).index(grid)
     role=grid.attrs.get('data-video-role','collection');count=sum(c.has('video-item')for c in grid.children);kind='gallery'if role=='supporting'or count>=3 else'pair'if count==2 else'large'
     rows.append({'system':'shared-'+kind,'role':role,'grid':g,'card':i,'src':n.attrs.get('data-video-src',f'https://www.youtube.com/embed/{n.attrs["data-video-id"]}?rel=0&playsinline=1'),'title':n.attrs.get('data-player-title'),'id':n.attrs['data-video-id']})
    elif n.tag=='iframe':
     src=n.attrs.get('src','');host=urlparse(src).hostname or''
     if host not in ['youtube.com','www.youtube.com','www.youtube-nocookie.com','youtube-nocookie.com']:other.append({'path':name,'src':src,'title':n.attrs.get('title')});continue
     box=n.ancestor(lambda a:a.has('hw-video-frame')or a.has('review-video-frame')or a.has('video-embed'))
     kind='homework'if box and box.has('hw-video-frame')else'review'if box and box.has('review-video-frame')else'legacy-inline'
     item=n.ancestor(lambda a:a.has('resource-item'));slot=n.ancestor(lambda a:a.has('hw-video-slot')or a.has('review-video-slot'));button=next((a for a in item.nodes()if a.has('hw-video-button')or a.has('review-video-button')),None)if item else None
     rows.append({'system':kind,'src':src,'title':n.attrs.get('title'),'id':urlparse(src).path.split('/')[-1],'iframe':sum(a.tag=='iframe'for a in t.root.nodes()if a.start<n.start),'slotId':slot.attrs.get('id')if slot else None,'resource':next((a.text().strip()for a in item.nodes()if a.has('resource-title')),'')if item else'','buttonLabel':button.text().strip()if button else None,'attrs':n.attrs})
   if rows:
    counts.update(r['system']for r in rows);pages.append({'path':name,'sharedAsset':'instructional-videos.css'in s,'players':rows})
   for line in s.splitlines():
    if 'iframe'in line and ('height:auto'in line or'aspect-ratio' in line):
     # CSS rules only; never use a backtracking whole-document brace regex.
     if len(line)<500:overrides.append({'path':name,'rule':line.strip()})
 return {'baseline':BASE,'videoPages':len(pages),'players':sum(counts.values()),'systems':dict(counts),'pages':pages,'unrelatedIframes':other,'deferredUnit6':deferred,'specialSizingRules':overrides}

if __name__=='__main__':
 d=inventory();
 if '--verify'in sys.argv:
  base=subprocess.check_output(['git','merge-base',BASE,UNIT6_SOURCE],cwd=ROOT,text=True).strip()
  imported=set(subprocess.check_output(['git','diff','--name-only',base,UNIT6_SOURCE],cwd=ROOT,text=True).splitlines())
  for entry in d['pages']:
   name=entry['path'];ref=UNIT6_SOURCE if name in imported else BASE
   actual=(ROOT/name).read_bytes();expected=subprocess.check_output(['git','show',ref+':'+name],cwd=ROOT)
   normalize=lambda b:re.sub(rb'(generatorVersion["\s]*:["\s]*)12\.9\.[CE]',rb'\g<1>VERSION',b)
   assert normalize(actual)==normalize(expected),name
  assert not d['deferredUnit6']
  print('PASS: all video HTML sources preserved against their approved A/B source; Unit 6 included')
 out=ROOT/'docs/audits/VIDEO-SIZING-INVENTORY.json';out.write_text(json.dumps(d,indent=2)+'\n');print(json.dumps({k:v for k,v in d.items()if k not in ['pages','specialSizingRules']},indent=2))
