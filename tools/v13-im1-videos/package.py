"""Build or verify the exact, complete v13.0.F website ZIP; keep all QA files outside it."""
import argparse
import functools
import hashlib
import http.server
import json
import re
import subprocess
import tempfile
import threading
import urllib.request
import urllib.parse
import zipfile
from pathlib import Path

ROOT=Path(__file__).resolve().parents[2]
NAME='bm-v13.0.F'
PREFIX=NAME+'/'

def git(*args):
    return subprocess.check_output(['git',*args],cwd=ROOT)

def verify(commit,archive,out):
    assert git('merge-base','--is-ancestor','0604079082f58c3168e52bc009d1330ba1f20c68',commit)==b''
    assert git('merge-base','--is-ancestor','98c9beb3c0eb58a952f6bb29e410e63aa280003e',commit)==b''
    assert git('merge-base','--is-ancestor','049e8a49d22f3d5ff67f5a79a855ec0028452ab7',commit)==b''
    attrs=git('show',commit+':.gitattributes').decode()
    ignored=[line.split()[0].strip('/') for line in attrs.splitlines()
             if line.strip() and not line.startswith('#') and 'export-ignore' in line.split()[1:]]
    assert {'tools','.github','docs','.gitattributes'}<=set(ignored)
    assert not any(re.search(r'[*?\[!]',p) for p in ignored),'Export policy must use explicit files/directories'
    expected={}
    for row in git('ls-tree','-rz',commit).split(b'\0'):
        if not row:continue
        meta,name=row.split(b'\t',1);name=name.decode()
        if not any(name==p or name.startswith(p+'/') for p in ignored):
            expected[name]=meta.split()[2].decode()
    with zipfile.ZipFile(archive) as z:
        assert z.comment.decode()==commit,'ZIP comment must identify the tested commit'
        infos=z.infolist()
        assert all(i.filename.startswith(PREFIX) for i in infos),'Exactly one short root folder is required'
        files={i.filename[len(PREFIX):]:i for i in infos if not i.is_dir()}
        assert len(files)==sum(not i.is_dir() for i in infos),'Duplicate ZIP entry'
        assert set(files)==set(expected),'Archive file list differs from the exact approved tree/export policy'
        for name,blob in expected.items():
            assert not any(part in ['..','.git','node_modules','__pycache__'] for part in Path(name).parts),name
            assert not re.search(r'[<>:"\\|?*]',name) and not name.endswith((' ','.')),name
            data=z.read(PREFIX+name)
            assert hashlib.sha1(b'blob '+str(len(data)).encode()+b'\0'+data).hexdigest()==blob,name
            # Git's archive carries timestamps, never machine/user identity fields.
            extra=files[name].extra
            while extra:
                ident=int.from_bytes(extra[:2],'little');size=int.from_bytes(extra[2:4],'little')
                assert ident in (0x5455,0x0001),(name,hex(ident))
                extra=extra[4+size:]
            if name.endswith(('.html','.js','.mjs','.css','.json','.txt','.webmanifest')):
                assert b'/workspace/' not in data and b'/home/agent/' not in data,name+': local machine path'
        assert z.testzip() is None
        version=json.loads(z.read(PREFIX+'assets/app-version.json'))
        assert version['version']=='13.0.F' and version['release']=='v13.0.F'
        assert json.loads(z.read(PREFIX+'package.json'))['version']=='13.0.F'
        assert "const VERSION = '13.0.F'" in z.read(PREFIX+'sw.js').decode()
        lock=json.loads(z.read(PREFIX+'assets/mathlive/dependency-lock.json'))['mathlive']['files']
        for entry in lock:
            data=z.read(PREFIX+'assets/mathlive/'+entry['path'])
            assert len(data)==entry['bytes'] and hashlib.sha256(data).hexdigest()==entry['sha256'],entry['path']
        three=json.loads(z.read(PREFIX+'assets/unit6-3d/dependency-lock.json'))['three']['files']
        for entry in three:
            data=z.read(PREFIX+'assets/unit6-3d/'+entry['path'])
            assert len(data)==entry['bytes'] and hashlib.sha256(data).hexdigest()==entry['sha256'],entry['path']
        assert len(files)==780,len(files)
        for name in ['cross-sections-3d.mjs','solids-3d.mjs','model-toggle.mjs','viewer.mjs','revolution-viewer.mjs','scene-kit.mjs']:
            assert 'assets/unit6-3d/'+name in files,name
        html=sum(n.endswith('.html') for n in files);pdf=sum(n.endswith('.pdf') for n in files)
        assert (html,pdf)==(288,290),(html,pdf)
        for need in ['index.html','LOCAL-TESTING.txt','assets/unit6-core.js','assets/unit6-regions.js',
                     'assets/unit6-ui.js','assets/unit6-volume.js','assets/unit6.css',
                     'assets/mathlive/integral-setup.mjs','assets/mathlive/unit6.mjs']:
            assert need in files,need
        extraction=Path(tempfile.mkdtemp(prefix='clean-extract-',dir=out))
        z.extractall(extraction)
    site=extraction/NAME
    class QuietHandler(http.server.SimpleHTTPRequestHandler):
        def log_message(self,*args):pass
    server=http.server.ThreadingHTTPServer(('127.0.0.1',0),functools.partial(QuietHandler,directory=str(site)))
    thread=threading.Thread(target=server.serve_forever,daemon=True);thread.start()
    smoke=['index.html','ap-calculus/index.html','im1/index.html','calculus-prep/index.html',
           'ap-calculus/unit-6-applications-integration/topics/volume-by-cross-sections/non-calculator-practice/index.html',
           'ap-calculus/unit-2-derivatives/topics/comprehensive-review/practice/index.html',
           'assets/mathlive/integral-setup.mjs','assets/mathlive/vendor/mathlive/mathlive.min.mjs',
           'assets/unit6-3d/cross-sections-3d.mjs','assets/unit6-3d/solids-3d.mjs',
           'assets/unit6-3d/vendor/three/three.module.min.mjs','assets/unit6-3d/vendor/three/OrbitControls.mjs',
           'assets/mathlive/'+next(e['path'] for e in lock if e['path'].endswith('.woff2')),
           next(n for n in files if n.endswith('.pdf'))]
    try:
        for name in smoke:
            with urllib.request.urlopen(f'http://127.0.0.1:{server.server_port}/'+urllib.parse.quote(name,safe='/')) as response:
                assert response.status==200 and response.read()==(site/name).read_bytes(),name
    finally:
        server.shutdown();server.server_close();thread.join()
    manifest={'testedCommit':commit,'zip':archive.name,'rootDirectory':PREFIX,
              'bytes':archive.stat().st_size,'sha256':hashlib.file_digest(archive.open('rb'),'sha256').hexdigest(),
              'includedFiles':len(expected),'htmlPages':html,'pdfFiles':pdf,'lockedMathLiveFiles':len(lock),'lockedThreeFiles':len(three),
              'allFilesMatchTestedCommit':True,'crcPassed':True,'cleanExtraction':True,
              'standaloneHttpChecks':len(smoke),'localMachinePaths':0,
              'testDownload':'https://github.com/batchmath/BatchMathSite/releases/download/v13.0.F/'+NAME+'.zip'}
    (out/'delivery-manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
    (out/(NAME+'.sha256')).write_text(manifest['sha256']+'  '+archive.name+'\n')
    print(json.dumps(manifest,indent=2))
    print('Extracted test directory:',site)
    return manifest,site

if __name__=='__main__':
    parser=argparse.ArgumentParser();parser.add_argument('--commit',default='HEAD')
    parser.add_argument('--out',type=Path,default=Path(tempfile.gettempdir())/'batchmath-v13.0.F-delivery')
    parser.add_argument('--zip',type=Path)
    args=parser.parse_args();args.out.mkdir(parents=True,exist_ok=True)
    commit=git('rev-parse',args.commit).decode().strip()
    archive=args.zip or args.out/(NAME+'.zip')
    if not args.zip:
        subprocess.run(['git','archive','--format=zip','-9','--prefix='+PREFIX,'--output='+str(archive),commit],cwd=ROOT,check=True)
    verify(commit,archive,args.out)
