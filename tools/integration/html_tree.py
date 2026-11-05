from html.parser import HTMLParser
from dataclasses import dataclass,field
import re
VOID=set('area base br col embed hr img input link meta param source track wbr'.split())
@dataclass
class Node:
 tag:str;attrs:dict;start:int;open_end:int;end:int=0;parent:object=None;children:list=field(default_factory=list);data:list=field(default_factory=list)
 def has(self,c):return c in self.attrs.get('class','').split()
 def nodes(self):
  for c in self.children:yield c;yield from c.nodes()
 def text(self):return ''.join(self.data)
 def ancestor(self,predicate):
  p=self.parent
  while p:
   if predicate(p):return p
   p=p.parent
class Tree(HTMLParser):
 def __init__(self,html):
  super().__init__(convert_charrefs=True);self.html=html;self.offsets=[0]+[m.end() for m in re.finditer('\n',html)];self.root=Node('root',{},0,0,len(html));self.stack=[self.root];self.feed(html)
 def pos(self):
  line,col=self.getpos();return self.offsets[line-1]+col
 def handle_starttag(self,tag,attrs):
  start=self.pos();node=Node(tag,dict(attrs),start,start+len(self.get_starttag_text()),parent=self.stack[-1]);self.stack[-1].children.append(node)
  if tag in VOID:node.end=node.open_end
  else:self.stack.append(node)
 def handle_startendtag(self,tag,attrs):
  self.handle_starttag(tag,attrs)
  if tag not in VOID:self.stack.pop().end=self.pos()+len(self.get_starttag_text())
 def handle_endtag(self,tag):
  for i in range(len(self.stack)-1,0,-1):
   if self.stack[i].tag==tag:
    end=self.html.find('>',self.pos())+1
    for n in self.stack[i:]:n.end=end
    del self.stack[i:];return
 def handle_data(self,data):
  for node in self.stack:node.data.append(data)
 def raw(self,node):return self.html[node.start:node.end]
