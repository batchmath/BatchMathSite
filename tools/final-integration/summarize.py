"""Consolidate fresh final-integration evidence without replacing source audit ledgers."""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
E = ROOT / 'docs/final-integration/evidence'

def read(name):
    return json.loads((E / name).read_text())

def cases(name, expected):
    data = read(name)
    assert not data.get('errors') and not data.get('pageErrors'), name
    rows = data['results']
    assert len(rows) == expected, (name, len(rows))
    assert all(r.get('passed', True) and not r.get('error') and not r.get('overflow') for r in rows), name
    return data

def entries(pattern, count):
    rows = [json.loads(p.read_text()) for p in E.glob(pattern)]
    assert len(rows) == count, (pattern, len(rows))
    for r in rows:
        assert not any(r.get(k) for k in ['failures', 'errors', 'scrollBoxes', 'pageOverflow']), r
        assert r['blankAtStart'] == r['mathliveFields'] == r['locked'], r
    return {k: sum(r.get(k, 0) for r in rows) for k in
            ['checked', 'parts', 'integrals', 'mathliveFields', 'blankAtStart', 'locked', 'graphChecks']} | {'runs': count}

def main():
    out = {'scope': 'Actual A+B merged site; source ledgers remain historical and separately labeled.'}
    tap = (E/'final-node.tap').read_text()
    assert '# tests 281' in tap and '# pass 281' in tap and '# fail 0' in tap
    out['node'] = {'tests': 281, 'pass': 281, 'fail': 0}
    blocked = cases('blocked-keypads.json', 119)
    assert all(r['correctAccepted'] and r['passed'] for r in blocked['results'])
    out['sourceABlockedKeypadForms'] = 119
    sweep = cases('route-sweep-v12.9.E-final.json', 404)
    assert not sweep['knownMathJaxErrors'] and not sweep['unexpectedErrors']
    out['routes'] = {'visits': 404, 'distinctRoutes': len({r['route'] for r in sweep['results']}),
                     'mathematicalRoutes': 128, 'specializedOrNavigation': 20, 'errors': 0}
    assert out['routes']['distinctRoutes'] == 148
    stability = cases('keypad-stability-v12.9.E.json', 164)
    recheck = cases('keypad-stability-v12.9.E-unit6-cube-root.json', 34)
    out['stability'] = {'distinctScenarios': 164, 'actions': stability['actions'],
                        'postCubeRootUnit6Rechecks': 34, 'recheckActions': recheck['actions'], 'errors': 0}
    cases('overlap-responsive.json', 102)
    out['im1ResponsiveChecks'] = 102
    focused = read('focused/pilots-summary.json') + read('focused/contracts-summary.json')
    assert len(focused) == 11 and all(r['exitCode'] == 0 for r in focused)
    docs = [json.loads((ROOT/r['evidence']).read_text()) for r in focused]
    assert not any(d.get('errors') or d.get('pageErrors') for d in docs)
    checks = sum(len(d['results']) for d in docs)
    pairs = sum(d.get('checkerPairs', 0) for d in docs)
    grading_pairs = sum(d.get('gradingPairs',0) for d in docs)
    assert pairs + grading_pairs == 543
    out['focusedBrowsers'] = {'suites': 11, 'checks': checks, 'topLevelCheckerPairs': pairs,
                             'pilotGradingPairs': grading_pairs, 'totalGraderPairs':pairs+grading_pairs, 'errors': 0}
    assert checks == 132
    sizing = cases('video-sizing-v12.9.E.json', 370)
    out['videos'] = {'inventoryPages': sizing['videoPages'], 'players': sizing['sourcePlayers'],
                     'sizingVisits': 370, 'playerMeasurements': sum(len(r['players']) for r in sizing['results']),
                     'presentation': read('video-presentation.json'), 'externalPlaybackVerified': False}
    out['unit6SourceMatrix'] = entries('unit6/entry-matrix/*.json', 56)
    assert (out['unit6SourceMatrix']['parts'], out['unit6SourceMatrix']['integrals'],
            out['unit6SourceMatrix']['mathliveFields']) == (627, 159, 613)
    out['unit6SourceMatrix']['inputPolicy'] = 'Original mixed keyboard/keypad; complex pieces may be pasted. Not a keypad-only claim.'
    out['unit6Legacy'] = entries('unit6/supplement/legacy-*.json', 10)
    out['unit6GraphAfterEntry'] = entries('unit6/supplement/graph-after-*.json', 4)
    for name, count in [('unit6/cross-integration.json',16), ('unit6/cube-root-browser.json',32),
                        ('unit6/legacy-cube-root.json',4)]:
        cases(name,count)
    out['unit6KeypadOnly'] = {'teacherAndStructuralCases':16, 'canonicalCubeRootCases':32, 'legacyCubeRootCases':4}
    control = read('unit6/control-catalog.json')
    assert not control['missingControls'] and not control['parseIssues']
    out['unit6ModelControlInventory'] = {k:v for k,v in control.items() if k not in ['fields','profiles']}
    out['unit6ModelControlInventory']['browserEvidence'] = False
    piecewise = read('unit6/piecewise-fit-final.json')
    assert piecewise['steps'] == 171
    assert set(piecewise['widths']) == {'360','375','390','1366'}
    for v in piecewise['widths'].values():
        assert not any(v[k] for k in ['overflowBraces','overflowLines','raw','merror','errors'])
    out['unit6PiecewiseFit'] = piecewise
    split = read('unit6/supplement/split-100.json')
    assert not any(split[k] for k in ['failures','equationsFalse','singleNotesFalse','optionalSplits'])
    out['unit6SplitAudit'] = {k:v for k,v in split.items() if k != 'families'}
    comparisons = read('site-suite/failure-comparison.json')
    assert comparisons['allComparedWithBothSources'] and comparisons['allInherited']
    assert comparisons['assertionFailureGroups'] == 11
    assert 'cases: 139' in (E/'keypad-structure-final.log').read_text()
    assert 'deep exit=0' in (E/'math-retry-summary.txt').read_text()
    assert 'unit5 exit=0' in (E/'math-retry-summary.txt').read_text()
    out['siteSuite'] = {'scripts':48, 'initialPass':35, 'initialAssertionFailureGroups':11,
                        'initialWrapperTimeouts':2, 'completeUnchangedMathRerunsPass':2,
                        'staleKeypadAssertionReconciled':1, 'finalEffectivePass':38,
                        'remainingInheritedGroups':10, 'allComparedWithBothSources':True,
                        'failureComparison':'site-suite/failure-comparison.json'}
    if (E/'version-E-node.tap').exists():
        version_tap=(E/'version-E-node.tap').read_text()
        assert '# tests 281' in version_tap and '# pass 281' in version_tap and '# fail 0' in version_tap
        assert all(r['exitCode']==0 for r in read('version-E-checks.json'))
        assert read('version-metadata.json')['passed'] and read('pwa-browser.json')['passed']
        out['finalVersionChecks']={'version':'12.9.E','release':'v12.9.E','nodePass':281,
                                   'staticAnalyticsPwaPassed':True,'actualServiceWorkerActivationAndOfflineHashesPassed':True}
    if (E/'downloaded-package-matrix').exists():
        out['downloadedPackageMatrix'] = entries('downloaded-package-matrix/*.json',56)
    (E/'final-qa.json').write_text(json.dumps(out,indent=2)+'\n')
    print(json.dumps({k:v for k,v in out.items() if k in ['routes','stability','focusedBrowsers','unit6Legacy','unit6GraphAfterEntry','siteSuite']},indent=2))

if __name__ == '__main__':
    main()
