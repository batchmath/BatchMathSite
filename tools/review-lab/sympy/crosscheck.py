"""SymPy/mpmath cross-check of the four rebuilt Unit 4 engines.

Reads the DISPLAYED TeX (question formula and answers) exported by sympy/export-sample.mjs, parses it
with its own TeX reader into SymPy, and verifies:
  indefinite: d/dx(answer) equals the integrand (symbolic derivative, evaluated at 40 digits)
  definite:   mpmath quadrature at 40 digits equals the displayed exact value
  MVT:        average by quadrature, continuity at the break, every c satisfies f(c) = average,
              and the number of solutions matches a high-precision scan.
Usage: python3 -I sympy/crosscheck.py <pylib> <sample.json> <out.json>   (sympy/run.sh does all of this)
"""
import sys, json, re
sys.path.insert(0, sys.argv[1])
import sympy as sp
import mpmath as mp

mp.mp.dps = 40
X = sp.Symbol('x', real=True)
CS = sp.Symbol('C', real=True)
FN = {'sin': sp.sin, 'cos': sp.cos, 'tan': sp.tan, 'sec': sp.sec, 'csc': sp.csc, 'cot': sp.cot, 'ln': sp.log, 'exp': sp.exp}
INV = {'sin': sp.asin, 'cos': sp.acos, 'tan': sp.atan}


def tokens(tex):
    s = tex.replace('\\displaystyle', '').replace('\\left', '').replace('\\right', '')
    s = s.replace('\\,', '§').replace('\\cdot', '*').replace('\\theta', 'θ').replace('\\pi', 'π')
    out, i = [], 0
    while i < len(s):
        ch = s[i]
        if ch.isspace():
            i += 1
        elif ch == '§':
            if out:
                out[-1]['sep'] = True
            i += 1
        elif ch == '\\':
            m = re.match(r'[A-Za-z]+', s[i + 1:])
            out.append({'t': 'cmd', 'v': m.group(0)})
            i += 1 + len(m.group(0))
        elif ch.isdigit() or ch == '.':
            j = i
            while j < len(s) and (s[j].isdigit() or s[j] == '.'):
                j += 1
            out.append({'t': 'num', 'v': s[i:j]})
            i = j
        elif ch.isalpha() or ch in 'θπ':
            out.append({'t': 'id', 'v': ch})
            i += 1
        else:
            out.append({'t': ch})
            i += 1
    return out


def rpow(base, e):
    """Real powers: an odd-denominator rational exponent of a possibly negative base stays real."""
    if isinstance(e, sp.Rational) and not e.is_integer and e.q % 2 == 1 and not (base.is_positive):
        return sp.sign(base) ** e.p * sp.Abs(base) ** e
    return base ** e


class Parser:
    def __init__(self, tex):
        self.T, self.i, self.abs_depth, self.tex = tokens(tex), 0, 0, tex

    def peek(self):
        return self.T[self.i] if self.i < len(self.T) else None

    def take(self):
        t = self.T[self.i]
        self.i += 1
        return t

    def expect(self, t):
        x = self.take()
        if x['t'] != t:
            raise ValueError(f'expected {t} in {self.tex}')

    def parse(self):
        e = self.sum()
        if self.i != len(self.T):
            raise ValueError('trailing tokens in ' + self.tex)
        return e

    def sum(self):
        a = self.product()
        while self.peek() and self.peek()['t'] in '+-':
            op = self.take()['t']
            b = self.product()
            a = a + b if op == '+' else a - b
        return a

    def starts_factor(self, p):
        return p and (p['t'] in ('num', 'id', 'cmd', '(', '{') or (p['t'] == '|' and self.abs_depth == 0))

    def product(self):
        a = self.unary()
        while True:
            p = self.peek()
            if not p:
                break
            if p['t'] == '*':
                self.take()
                a = a * self.unary()
            elif p['t'] == '/':
                self.take()
                a = a / self.unary()
            elif self.starts_factor(p):
                a = a * self.power()
            else:
                break
        return a

    def unary(self):
        p = self.peek()
        if p and p['t'] == '-':
            self.take()
            return -self.unary()
        if p and p['t'] == '+':
            self.take()
            return self.unary()
        return self.power()

    def group(self):
        if self.peek() and self.peek()['t'] == '{':
            self.take()
            e = self.sum()
            self.expect('}')
            return e
        return self.atom()

    def power(self):
        a = self.atom()
        while self.peek() and self.peek()['t'] == '^':
            self.take()
            b = self.group()
            a = rpow(a, sp.nsimplify(b) if b.is_number else b)
        return a

    def fn_arg(self):
        p = self.peek()
        if p and p['t'] == '(':
            self.take()
            e = self.sum()
            self.expect(')')
            return e
        if p and p['t'] in ('{', '|'):
            return self.atom() if p['t'] == '|' else self.group()
        e = None
        while self.peek() and self.peek()['t'] in ('num', 'id'):
            last = self.peek()
            x = self.atom()
            e = x if e is None else e * x
            if self.peek() and self.peek()['t'] == '^':
                self.take()
                e = rpow(e, self.group())
            if last.get('sep') or self.T[self.i - 1].get('sep'):
                break
        if e is not None:
            return e
        if self.peek() and self.peek()['t'] == 'cmd':
            return self.atom()
        raise ValueError('function argument in ' + self.tex)

    def atom(self):
        p = self.take()
        t = p['t']
        if t == 'num':
            return sp.Rational(p['v'])
        if t == 'id':
            v = p['v']
            if v == 'π':
                return sp.pi
            if v == 'e':
                return sp.E
            if v == 'C':
                return CS
            if v in 'xtrθ':
                return X
            raise ValueError(f'unexpected letter {v} in {self.tex}')
        if t == '(':
            e = self.sum()
            self.expect(')')
            return e
        if t == '{':
            e = self.sum()
            self.expect('}')
            return e
        if t == '|':
            self.abs_depth += 1
            e = self.sum()
            self.abs_depth -= 1
            self.expect('|')
            return sp.Abs(e)
        if t == 'cmd':
            v = p['v']
            if v in ('frac', 'dfrac', 'tfrac'):
                a = self.group()
                b = self.group()
                return a / b
            if v == 'sqrt':
                n = 2
                if self.peek() and self.peek()['t'] == '[':
                    self.take()
                    n = int(self.take()['v'])
                    self.expect(']')
                body = self.group()
                return sp.sqrt(body) if n == 2 else rpow(body, sp.Rational(1, n))
            if v in FN:
                f, pw = FN[v], None
                if self.peek() and self.peek()['t'] == '^':
                    self.take()
                    e = self.group()
                    if e == -1 and v in INV:
                        f = INV[v]
                    else:
                        pw = e
                arg = self.fn_arg()
                node = f(arg)
                return node ** pw if pw is not None else node
            raise ValueError(f'unknown command \\{v} in {self.tex}')
        raise ValueError(f'unexpected {t} in {self.tex}')


def P(tex):
    return Parser(tex).parse()


def num(expr, xv=None):
    e = expr if xv is None else expr.subs(X, xv)
    v = sp.N(e, 40)
    if v.has(sp.I) or not v.is_real and not v.is_number:
        c = complex(v)
        if abs(c.imag) > 1e-30:
            raise ValueError('complex value')
        return mp.mpf(c.real)
    return mp.mpf(str(v)) if v.is_finite else mp.nan


def close(a, b, rel=mp.mpf('1e-25')):
    return abs(a - b) <= rel * max(1, abs(a), abs(b))


def integral_parts(tex):
    m = re.match(r'^\\int(?:_\{(.*?)\}\^\{(.*?)\})?\s*(.*)\\,d(x|t|\\theta|r)$', tex)
    if not m:
        raise ValueError('integral form: ' + tex[:80])
    return m.group(1), m.group(2), m.group(3)


def brace_split(tex):
    """\\int_{lo}^{hi} body \\,dx with brace-aware bounds."""
    if not tex.startswith('\\int'):
        raise ValueError('not an integral')
    rest, lo, hi = tex[4:], None, None

    def grab(s, i):
        d = 0
        for j in range(i, len(s)):
            if s[j] == '{':
                d += 1
            elif s[j] == '}':
                d -= 1
                if d == 0:
                    return s[i + 1:j], j + 1
        raise ValueError('brace')
    if rest.startswith('_{'):
        lo, k = grab(rest, 1)
        rest = rest[k:]
        hi, k = grab(rest, 1)
        rest = rest[k:]
    m = re.match(r'^([\s\S]*)\\,d(x|t|\\theta|r)$', rest)
    return lo, hi, m.group(1).strip()


def check_indefinite(item, st):
    _, _, body = brace_split(item['formula'])
    f = P(body)
    F = P(re.sub(r'\+C$', '', st['tex']))
    dF = sp.diff(F, X)
    pts = 0
    for a, b in st['components']:
        for k in range(5):
            xv = sp.Rational(a) + (sp.Rational(b) - sp.Rational(a)) * sp.Rational(2 * k + 1, 10)
            try:
                fv = num(f, xv)
            except Exception:
                continue
            if not mp.isfinite(fv):
                continue
            dv = num(dF, xv)
            if not close(dv, fv, mp.mpf('1e-20')):
                return f'derivative {mp.nstr(dv, 15)} != integrand {mp.nstr(fv, 15)} at x={float(xv):.4f}'
            pts += 1
    return None if pts >= 3 else f'only {pts} usable points'


def breakpoints(f, a, b):
    """Points in (a, b) where an |u|, sign(u) or fractional power u^(p/q) has u = 0 (cusps for quadrature)."""
    pts = set()
    for node in sp.preorder_traversal(f):
        base = None
        if isinstance(node, (sp.Abs, sp.sign)):
            base = node.args[0]
        elif isinstance(node, sp.Pow) and not node.exp.is_integer:
            base = node.base
        if base is None or not base.has(X):
            continue
        try:
            for r in sp.solve(sp.Eq(base, 0), X):
                if r.is_real:
                    rv = mp.mpf(str(sp.N(r, 40)))
                    if a < rv < b:
                        pts.add(rv)
        except Exception:
            pass
    return sorted(pts)


def quad(f, a, b):
    g = sp.lambdify(X, f, modules=['mpmath'])
    return mp.quad(g, [a, *breakpoints(f, a, b), b])


def check_definite(item, st):
    lo, hi, body = brace_split(item['formula'])
    f = P(body)
    a, b = num(P(lo)), num(P(hi))
    I = quad(f, a, b)
    shown = num(P(st['tex']))
    return None if close(I, shown, mp.mpf('1e-22')) else f'quad {mp.nstr(I, 20)} != shown {mp.nstr(shown, 20)}'


def parse_mvt(formula):
    formula = formula.replace('\\allowbreak', '')
    m = re.match(r'^f\(x\)=([\s\S]*)\\text\{ on \}\\left\[([\s\S]*),\\,([\s\S]*)\\right\]$', formula)
    body, a, b = m.group(1), num(P(m.group(2))), num(P(m.group(3)))
    if body.startswith('\\begin{cases}'):
        rows = body[len('\\begin{cases}'):-len('\\end{cases}')].split('\\\\')
        pieces = []
        for row in rows:
            e, c = row.split(', &')
            cm = re.match(r'^\s*x\s*\\(le|lt|ge|gt)\s*(.+)$', c)
            pieces.append((P(e.strip()), cm.group(1), num(P(cm.group(2)))))
        return a, b, pieces
    return a, b, [(P(body), None, None)]


def check_mvt(item, st, state):
    a, b, pieces = parse_mvt(item['formula'])
    brk = pieces[0][2] if len(pieces) > 1 else None
    segs = [(a, brk, pieces[0][0]), (brk, b, pieces[1][0])] if brk is not None else [(a, b, pieces[0][0])]
    if 'avg' not in state:
        state['avg'] = sum(quad(f, u, v) for u, v, f in segs) / (b - a)
    avg = state['avg']
    if st['kind'] == 'exact-number':
        shown = num(P(st['tex']))
        return None if close(avg, shown, mp.mpf('1e-22')) else f'average {mp.nstr(avg, 20)} != shown {mp.nstr(shown, 20)}'
    continuous = True
    if brk is not None:
        continuous = close(num(pieces[0][0], sp.Float(str(brk), 40)), num(pieces[1][0], sp.Float(str(brk), 40)), mp.mpf('1e-25'))
    if 'Does not apply' in st['tex']:
        return None if not continuous else 'continuous f but answer is Does not apply'
    if not continuous:
        return 'discontinuous f but values of c are given'
    cs = [num(P(t)) for t in st['tex'].split(',\\ ')]
    for c in cs:
        if not (a - mp.mpf('1e-30') <= c <= b + mp.mpf('1e-30')):
            return f'c={mp.nstr(c, 12)} outside [a, b]'
        f = pieces[0][0] if brk is None or c <= brk else pieces[1][0]
        if not close(num(f, sp.Float(str(c), 40)), avg, mp.mpf('1e-20')):
            return f'f(c) != average at c={mp.nstr(c, 15)}'
    # count solutions by a sign scan of each piece on its own subinterval
    roots = []
    for u, v, f in segs:
        g = sp.lambdify(X, f - sp.Float(str(avg), 40), modules=['mpmath'])
        n = 3000
        prev_x, prev = u, g(u)
        if prev == 0:
            roots.append(u)
        for k in range(1, n + 1):
            xv = u + (v - u) * k / n
            w = g(xv)
            if w == 0 or prev * w < 0:
                roots.append(mp.findroot(g, (prev_x, xv), solver='bisect') if prev * w < 0 else xv)
            prev_x, prev = xv, w
    uniq = []
    for r in sorted(roots):
        if not any(abs(r - q) < mp.mpf('1e-12') for q in uniq):
            uniq.append(r)
    if len(uniq) != len(cs):
        return f'{len(cs)} c values shown, {len(uniq)} solutions found'
    return None


def main():
    items = json.load(open(sys.argv[2]))
    report = {'checked': 0, 'answers': 0, 'failures': [], 'byEngine': {}}
    for it in items:
        eng = report['byEngine'].setdefault(it['engine'], {'problems': 0, 'answers': 0, 'failures': 0})
        state = {}
        for st in it['stages']:
            try:
                if st['kind'] == 'antiderivative':
                    err = check_indefinite(it, st)
                elif it['engine'] == 'mvt':
                    err = check_mvt(it, st, state)
                else:
                    err = check_definite(it, st)
            except Exception as e:  # parsing or evaluation trouble is a failure too
                err = f'error: {type(e).__name__}: {e}'
            report['answers'] += 1
            eng['answers'] += 1
            if err:
                eng['failures'] += 1
                if len(report['failures']) < 60:
                    report['failures'].append(f"{it['engine']} {it['variant']} {it['id']}: {err}")
        report['checked'] += 1
        eng['problems'] += 1
    json.dump(report, open(sys.argv[3], 'w'), indent=1)
    print(json.dumps({k: v for k, v in report.items() if k != 'failures'}, indent=1))
    print('\n'.join(report['failures'][:40]))


main()
