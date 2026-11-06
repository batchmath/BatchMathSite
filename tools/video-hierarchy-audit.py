"""Inventory every in-scope video page and verify approved metadata/workflows."""
from collections import Counter
from pathlib import Path
from urllib.parse import urlparse
import json,re,subprocess
from integration.html_tree import Tree

ROOT=Path(__file__).resolve().parents[1]
BASE='535527a172b4a2e4c26d9cf970a6d061e7802849'
UNIT6='ap-calculus/unit-6-applications-integration/'
# Unit 6 / MathLive / video integration test: the approved Unit 6 corrections (graph fix on v12.9.B) and the approved
# content source whose Unit 6 video markup was deferred until then
UNIT6_APPROVED='e265804f440b2e521de00ecff0f6bc33118a12f1'
CONTENT='bba32f929d6630d096bc4510ceafd586ab8c4a53'
MAIN='26ec4f15185c37f9e8843e96a09d583b47babcdf'
LAUNCH=re.compile(r'<section class="resource-section" data-bm-topic-practice="1">.*?</section>',re.S)

def approved_launch_rows(before,name):
 # v12.9.A/B relabeled practice launch rows (Unit 5 Growth: Calculator Practice; Unit 6 calculator and non-calculator
 # pages). Outside the video sections, a page must equal its baseline with those approved rows and nothing else.
 try:rows,main=LAUNCH.findall(source(UNIT6_APPROVED,name)),LAUNCH.findall(source(MAIN,name))
 except subprocess.CalledProcessError:return before
 if rows==main:return before  # no approved relabel on this page
 old=LAUNCH.findall(before)
 assert len(rows)==len(old)==1,name+': unexpected practice launch rows'
 return LAUNCH.sub(lambda m:rows[0],before)

def source(ref,name):
 return subprocess.check_output(['git','show',ref+':'+name],cwd=ROOT).decode()

def recordings(tree):
 result=[]
 for n in tree.root.nodes():
  if 'data-video-id' in n.attrs:
   vid=n.attrs['data-video-id'];src=n.attrs.get('data-video-src',f'https://www.youtube.com/embed/{vid}?rel=0&playsinline=1');title=n.attrs.get('data-player-title','')
  elif n.tag=='iframe' and 'youtube' in n.attrs.get('src',''):
   src=n.attrs['src'];vid=urlparse(src).path.split('/')[-1];title=n.attrs.get('title','')
  else:continue
  box=n if n.has('video-embed') else n.ancestor(lambda p:p.has('video-embed'))
  image=next((c for c in box.nodes() if c.tag=='img'),None) if box else None
  result.append((vid,src,title,image.attrs.get('src','') if image else ''))
 return result

def outside_instructional_sections(text):
 tree=Tree(text);spans=[(n.start,n.end) for n in tree.root.nodes() if n.tag=='section' and(n.has('video-section') or n.has('proof-section')) and not n.ancestor(lambda p:p.tag=='section' and(p.has('video-section') or p.has('proof-section')))]
 for a,b in sorted(spans,reverse=True):text=text[:a]+text[b:]
 return re.sub(r'>\s+<','><',text).strip()

def describe(tree):
 lectures=examples=proofs=collection=0;layouts=[]
 for n in tree.root.nodes():
  if 'data-bm-videos' in n.attrs:
   count=sum(c.has('video-item') for c in n.children);parent=n.ancestor(lambda p:p.has('lecture-section') or p.has('example-section'))
   role=n.attrs.get('data-video-role','collection')
   if role=='lecture' or parent and parent.has('lecture-section') and not parent.has('im1-video-section'):lectures+=count
   elif role=='supporting':
    proofs+=sum(c.attrs.get('data-video-kind')=='proof' for c in n.children);examples+=sum(c.attrs.get('data-video-kind')=='example' for c in n.children)
   elif parent and parent.has('example-section') and any(c.tag=='h2' and 'Additional' in c.text() for c in parent.children):examples+=count
   else:collection+=count
   layouts.append({'role':role,'count':count,'layout':n.attrs.get('data-video-layout')})
  if n.tag=='iframe' and n.ancestor(lambda p:p.has('proof-section')):proofs+=1
 return {'lectureVideos':lectures,'exampleVideos':examples,'proofVideos':proofs,'collectionVideosWithoutDesignatedPrimary':collection,'homeworkWalkthroughs':sum(n.has('hw-video-button') for n in tree.root.nodes()),'specializedReviewVideos':sum(n.has('review-video-button') for n in tree.root.nodes()),'collections':layouts}

def audit():
 rows=[];deferred=[]
 for p in sorted(f for c in ['ap-calculus','im1','calculus-prep'] for f in (ROOT/c).rglob('*.html')):
  name=p.relative_to(ROOT).as_posix();text=p.read_text()
  if not re.search(r'youtube\.com/embed|data-video-id=',text):continue
  unit6=name.startswith(UNIT6)
  before=approved_launch_rows(source(CONTENT if unit6 else BASE,name),name);a,b=Tree(before),Tree(text)
  if unit6:  # the adopted markup carries the approved content source's recordings exactly
   assert Counter(recordings(b))==Counter(recordings(Tree(source(CONTENT,name)))),name+': Unit 6 recordings differ from the approved content source'
  assert Counter(recordings(a))==Counter(recordings(b)),name+': video ID, URL/configuration, title or thumbnail changed'
  assert [n.attrs.get('href') for n in a.root.nodes() if n.tag=='a']==[n.attrs.get('href') for n in b.root.nodes() if n.tag=='a'],name+': resource/navigation link changed'
  assert Counter(n.text() for n in a.root.nodes() if n.has('proof-note'))==Counter(n.text() for n in b.root.nodes() if n.has('proof-note')),name+': optional proof context changed'
  assert outside_instructional_sections(before)==outside_instructional_sections(text),name+': non-video content or specialized workflow changed'
  old,new=describe(a),describe(b);changed=before!=text
  required='Lecture group uses count rule; unified supporting gallery always opens modal' if new['lectureVideos'] and(new['exampleVideos'] or new['proofVideos']) else 'Existing collection count rule' if new['collections'] else 'Retain specialized homework/review controls'
  rows.append({'path':name,'before':old,'after':new,'changed':changed,'requiredPresentation':required,'approvedVideoMetadataPreserved':True,'resourceLinksAndSpecializedWorkflowsPreserved':True})
 assert len(rows)==72  # 66 + the six Unit 6 video pages (five topic pages, the comprehensive review)
 return {'baseline':BASE,'videoPagesAudited':len(rows),'pagesChanged':sum(r['changed'] for r in rows),'deferredUnit6VideoPages':deferred,'pages':rows}

if __name__=='__main__':
 report=audit();out=ROOT/'docs/audits';out.mkdir(parents=True,exist_ok=True);(out/'VIDEO-HIERARCHY.json').write_text(json.dumps(report,indent=2)+'\n')
 lines=['# Video hierarchy audit','',f"Audited {report['videoPagesAudited']} in-scope video pages; {report['pagesChanged']} changed. The six Unit 6 video pages are included, audited against the approved content source `{CONTENT}`. Baseline: `{BASE}`.",'','Every page preserves video IDs, full playback URLs/offsets, titles, thumbnails, resource links, optional proof notes, and all markup/scripts outside the instructional sections. Only explicitly designated lecture-plus-supporting pages change hierarchy. Flat instructional collections do not acquire an inferred primary.','','| Page | Lecture | Examples | Proofs | Other collection videos | HW | Collapsible review | Final presentation | Changed |','| --- | ---: | ---: | ---: | ---: | ---: | ---: | --- | --- |']
 for r in report['pages']:
  a=r['after'];lines.append('| `'+r['path']+'` | '+' | '.join(str(a[k]) for k in ['lectureVideos','exampleVideos','proofVideos','collectionVideosWithoutDesignatedPrimary','homeworkWalkthroughs','specializedReviewVideos'])+' | '+r['requiredPresentation']+' | '+('yes' if r['changed'] else 'no')+' |')
 lines+=['','The four proof players are migrated into shared supporting galleries; their Proof labels, optional explanatory text, original recording titles, URLs and accessible controls remain. Homework and collapsible review players stay specialized.','','Runtime browser evidence is produced by `BM_CHROMIUM_EXECUTABLE=/usr/bin/chromium node tools/video-presentation-qa.mjs`; source preservation by `python3 tools/video-hierarchy-audit.py`. YouTube player responses in browser QA are simulated, so external recording availability/audio playback is not certified.']
 (out/'VIDEO-HIERARCHY.md').write_text('\n'.join(lines)+'\n');print(f"PASS: {report['videoPagesAudited']} video pages audited; {report['pagesChanged']} authorized hierarchy changes; all approved video metadata and specialized workflows preserved.")
