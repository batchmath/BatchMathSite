#!/usr/bin/env python3
"""Independent SymPy check of Unit 5 initial-value problems (Basic First-Order and Separable).

Input: JSON lines from dump-ivp.mjs. The differential equation and the initial condition are re-parsed from the
TeX the student sees (through a small parser written here, not the site's checker), and the engine's answer is
checked by symbolic differentiation:
  1. residual  y'(x) - f(x, y(x)) is zero at many points of the interval (high-precision evaluation),
  2. the initial condition holds,
  3. the interval of validity is recomputed as the connected component containing x0 of
     continuous_domain(y) ∩ continuous_domain(f(x, y(x))) over the reals, and compared with the engine's,
     including which endpoints are closed. When SymPy cannot find the domain the interval is scanned numerically.
Usage: node dump-ivp.mjs <slug> <file> N | python3 -I sympy_ivp.py
"""
import json, math, random, re, signal, sys
import sympy as sp
from sympy.calculus.util import continuous_domain

X, Y = sp.symbols('X Y', real=True)
FUNCS = {'asin': sp.asin, 'acos': sp.acos, 'atan': sp.atan, 'sqrt': sp.sqrt, 'cbrt': lambda a: sp.real_root(a, 3),
         'sin': sp.sin, 'cos': sp.cos, 'tan': sp.tan, 'sec': sp.sec, 'csc': sp.csc, 'cot': sp.cot, 'ln': sp.log,
         'log': sp.log, 'abs': sp.Abs, 'exp': sp.exp}
NAMES = sorted(FUNCS, key=len, reverse=True)


class Parser:
    """Linear math text (keypad form or the engine's expression syntax) to SymPy.
    xv, yv: the letters used for the independent and dependent variables."""
    def __init__(self, text, xv, yv):
        self.s = text.replace(' ', '').replace('θ', 'q').replace('−', '-').replace('\\', '')
        self.i = 0
        self.vars = {('q' if xv == 'θ' else xv): X, yv: Y}

    def peek(self):
        return self.s[self.i] if self.i < len(self.s) else ''

    def take(self, c):
        if self.s.startswith(c, self.i):
            self.i += len(c)
            return True
        return False

    def parse(self):
        e = self.expr()
        if self.i != len(self.s):
            raise ValueError(f'trailing text at {self.i}: {self.s[self.i:]}')
        return e

    def expr(self):
        e = self.term()
        while self.peek() in '+-' and self.peek():
            op = self.s[self.i]; self.i += 1
            t = self.term()
            e = e + t if op == '+' else e - t
        return e

    def starts_factor(self):
        c = self.peek()
        return bool(c) and (c.isalnum() or c in '(|.')

    def term(self):
        e = self.factor()
        while True:
            if self.take('*'):
                e = e * self.factor()
            elif self.take('/'):
                e = e / self.factor()
            elif self.starts_factor():
                e = e * self.factor()
            else:
                return e

    def factor(self):
        if self.take('-'):
            return -self.factor()
        if self.take('+'):
            return self.factor()
        return self.power()

    def power(self):
        base = self.atom()
        if self.take('^'):
            exp = self.factor_for_power()
            if exp.is_Rational and exp.q > 1 and exp.q % 2 == 1:   # odd roots are real, as on the page (cube root of -8 is -2)
                return sp.real_root(base, exp.q) ** exp.p
            return base ** exp
        return base

    def factor_for_power(self):
        if self.take('-'):
            return -self.factor_for_power()
        return self.atom()

    def number(self):
        m = re.match(r'\d+(\.\d+)?|\.\d+', self.s[self.i:])
        self.i += len(m.group(0))
        return sp.Rational(m.group(0))

    def bare_arg(self):
        # the argument of a function written without parentheses: sin x, ln 2, sin 2x, cos pi y
        if self.peek() == '(':
            return self.group()
        parts = []
        if self.peek().isdigit():
            parts.append(self.number())
        if self.take('pi'):
            parts.append(sp.pi)
        if self.peek() and self.peek() in self.vars:       # at most one variable: sec t tan t is sec(t)·tan(t)
            parts.append(self.vars[self.s[self.i]]); self.i += 1
        if not parts:
            raise ValueError(f'function argument expected at {self.i}: {self.s}')
        return sp.Mul(*parts)

    def group(self):
        if not self.take('('):
            raise ValueError(f'( expected at {self.i}: {self.s}')
        e = self.expr()
        if not self.take(')'):
            raise ValueError(f') expected at {self.i}: {self.s}')
        return e

    def atom(self):
        c = self.peek()
        if c == '(':
            return self.group()
        if c == '|':
            self.i += 1
            e = self.expr()
            self.take('|')
            return sp.Abs(e)
        if c.isdigit() or c == '.':
            return self.number()
        for name in NAMES:
            if self.s.startswith(name, self.i):
                self.i += len(name)
                pw = None
                if self.take('^'):
                    pw = self.factor_for_power()
                arg = self.bare_arg()
                v = FUNCS[name](arg)
                return v ** pw if pw is not None else v
        if self.take('pi'):
            return sp.pi
        if self.take('infinity'):
            return sp.oo
        if c == 'e':
            self.i += 1
            return sp.E
        if c in self.vars:
            self.i += 1
            return self.vars[c]
        raise ValueError(f'unexpected {c!r} at {self.i}: {self.s}')


def P(text, xv='x', yv='y'):
    return Parser(text, xv, yv).parse()


class Timeout(Exception):
    pass


def _alarm(signum, frame):
    raise Timeout()


signal.signal(signal.SIGALRM, _alarm)


def value(e, x):
    v = sp.N(e.subs(X, x), 30)
    if v.has(sp.zoo, sp.nan, sp.oo, -sp.oo) or not v.is_number:
        return None
    re_, im_ = v.as_real_imag()
    if abs(float(im_)) > 1e-20:
        return None
    return float(re_)


def structural_pieces(e):
    """Sub-expressions whose zeros (or whose reaching ±1) can end an interval: denominators, even-root radicands,
    logarithm arguments, inverse sine/cosine arguments, and tan/sec/cot/csc arguments."""
    out = []
    for node in sp.preorder_traversal(e):
        if isinstance(node, sp.Pow):
            b, ex = node.args
            if ex.is_number and (ex.is_negative or (ex.is_Rational and ex.q % 2 == 0)):
                out.append(('zero', b))
        elif isinstance(node, sp.log):
            out.append(('zero', node.args[0]))
        elif isinstance(node, (sp.asin, sp.acos)):
            out.append(('zero', node.args[0] - 1)); out.append(('zero', node.args[0] + 1))
        elif isinstance(node, (sp.tan, sp.sec)):
            out.append(('zero', sp.cos(node.args[0])))
        elif isinstance(node, (sp.cot, sp.csc)):
            out.append(('zero', sp.sin(node.args[0])))
    return out


def zeros(g, lo, hi):
    """Real zeros of g on [lo, hi]: exact from solveset when it gives a finite set, else numeric."""
    try:
        signal.alarm(4)
        S = sp.solveset(g, X, sp.Interval(lo, hi))
        signal.alarm(0)
        if isinstance(S, sp.FiniteSet):
            return [(z, True) for z in S if z.is_real]
    except Exception:
        signal.alarm(0)
    import mpmath as mp
    try:
        fn = sp.lambdify(X, g, 'mpmath')
    except Exception:
        return []
    def gv(x):
        try:
            v = mp.mpc(fn(mp.mpf(x)))
            return float(v.real) if abs(v.imag) < 1e-12 else None
        except Exception:
            return None
    out = []; n = 12000; prev = None; px = None
    for k in range(n + 1):
        x = lo + (hi - lo) * k / n; v = gv(x)
        if v is not None and prev is not None and (v == 0 or prev * v < 0):
            a, b, fa = px, x, prev
            for _ in range(80):
                m = (a + b) / 2; fm = gv(m)
                if fm is None: break
                if fa * fm <= 0: b = m
                else: a, fa = m, fm
            out.append((sp.Float((a + b) / 2, 30), False))
        prev, px = v, x
    return out


def num(e):
    v = sp.N(e, 40)
    if v.has(sp.nan, sp.zoo, sp.oo, -sp.oo) or not v.is_number:
        return None
    z = complex(v)
    return z


def pieces_ok(e, at):
    """Every structural condition of e holds at the point: no zero denominator, log argument > 0, even-root
    radicand >= 0, inverse sine/cosine argument in [-1, 1], tan/sec/cot/csc defined. Evaluated piece by piece with
    simultaneous substitution, so nothing cancels before it is checked."""
    for node in sp.preorder_traversal(e):
        if isinstance(node, sp.Pow):
            b, ex = node.args
            if not ex.is_number:
                continue
            bv = num(b.subs(at, simultaneous=True))
            if bv is None:
                return False
            if ex.is_negative and abs(bv) < 1e-25:
                return False
            if ex.is_Rational and ex.q % 2 == 0 and (abs(bv.imag) > 1e-25 or bv.real < -1e-25):
                return False
        elif isinstance(node, sp.log):
            av = num(node.args[0].subs(at, simultaneous=True))
            if av is None or abs(av.imag) > 1e-25 or av.real <= 1e-25:
                return False
        elif isinstance(node, (sp.asin, sp.acos)):
            av = num(node.args[0].subs(at, simultaneous=True))
            if av is None or abs(av.imag) > 1e-25 or abs(av.real) > 1 + 1e-25:
                return False
        elif isinstance(node, (sp.tan, sp.sec, sp.cot, sp.csc)):
            g = sp.cos(node.args[0]) if isinstance(node, (sp.tan, sp.sec)) else sp.sin(node.args[0])
            gv = num(g.subs(at, simultaneous=True))
            if gv is None or abs(gv) < 1e-25:
                return False
    return True


def defined(sol, f, c):
    """Is the solution defined (and real) at c, and the original equation defined at (c, y(c))?"""
    try:
        signal.alarm(6)
        if not pieces_ok(sol, {X: c}):
            signal.alarm(0); return False
        yc = sp.nsimplify(sp.simplify(sol.subs(X, c)))
        yv = num(yc)
        ok = yv is not None and abs(yv.imag) < 1e-25 and pieces_ok(f, {X: c, Y: yc})
        if ok:
            fv = num(f.subs({X: c, Y: yc}, simultaneous=True))
            ok = fv is not None and abs(fv.imag) < 1e-20
        signal.alarm(0)
        return bool(ok)
    except Exception:
        signal.alarm(0)
        return False


def diverges(sol, f, c, d):
    """For a numeric candidate: does the solution or the equation blow up approaching c from the inside?"""
    mags = []
    for k in (3, 5, 7, 9):
        x = c - d * 10 ** (-k)
        v = value(sol, x); fv = value(f.subs(Y, sol), x)
        if v is None or fv is None:
            return True
        mags.append(max(abs(v), abs(fv)))
    return mags[-1] > 50 * mags[0]


def validity_interval(sol, f, x0):
    """Maximal interval containing x0 on which the solution is defined and satisfies the equation."""
    cands = []
    for kind, g in structural_pieces(sol) + structural_pieces(f):
        gx = g.subs(Y, sol)
        cands += zeros(gx, float(x0) - 100, float(x0) + 100)
    ends = []
    for d in (-1, 1):
        side = sorted({(float(c), c, exact) for c, exact in cands if (float(c) - float(x0)) * d > 1e-12}, key=lambda t: abs(t[0] - float(x0)))
        end = (d * math.inf, False)
        # the initial value itself can sit on the edge of the domain (sqrt(x) with x0 = 0): then it is a closed end
        if value(sol, float(x0) + d * 1e-7) is None or value(f.subs(Y, sol), float(x0) + d * 1e-7) is None:
            ends.append((float(x0), True)); continue
        for cf, c, exact in side:
            beyond = value(sol, cf + d * 1e-7) is not None and value(f.subs(Y, sol), cf + d * 1e-7) is not None
            if exact:
                if not defined(sol, f, c):
                    end = (cf, False); break
                if not beyond:
                    end = (cf, True); break
            else:
                if diverges(sol, f, cf, d) or not beyond:
                    end = (cf, False); break
        ends.append(end)
    return ends[0][0], ends[1][0], ends[0][1], ends[1][1]


def check(rec):
    xv, yv = rec['x'], rec['y']
    f = P(rec['rhs'], xv, yv)
    x0 = P(rec['x0'], xv, yv); y0 = P(rec['y0'], xv, yv)
    sol = P(rec['answer'], 'x', 'y')        # the engine writes its answer in x
    out = {'id': rec['id'], 'family': rec['family'], 'issues': []}
    # 1. initial condition
    v0 = value(sol, x0)
    if v0 is None or abs(v0 - float(y0)) > 1e-10 * max(1, abs(float(y0))):
        out['issues'].append(f'initial condition: y({x0}) = {v0}, expected {float(y0)}')
    # 2. residual of the differential equation, by symbolic differentiation
    h = f.subs(Y, sol)
    res = sp.diff(sol, X) - h
    iv = rec.get('interval')
    lo = float(P(iv['left'])) if iv else float(x0) - 3
    hi = float(P(iv['right'])) if iv else float(x0) + 3
    a = max(lo, float(x0) - 5) if math.isfinite(lo) else float(x0) - 5
    b = min(hi, float(x0) + 5) if math.isfinite(hi) else float(x0) + 5
    random.seed(rec['id'])
    bad = 0
    for k in range(14):
        x = a + (b - a) * (0.02 + 0.96 * random.random())
        r = value(res, x); fv = value(h, x)
        if r is None or fv is None or abs(r) > 1e-9 * (1 + abs(fv)):
            bad += 1
    if bad:
        out['issues'].append(f'residual nonzero or undefined at {bad} of 14 points in [{a:.3f}, {b:.3f}]')
    # 3. interval of validity, recomputed from the structure of the solution and of the original equation
    if iv:
        comp = validity_interval(sol, f, x0)
        want = (lo, hi, iv['lc'], iv['rc'])
        same = all((math.isinf(p) and math.isinf(q) and p == q) or (not math.isinf(p) and not math.isinf(q) and abs(p - q) < 1e-6) for p, q in zip(comp[:2], want[:2]))
        if not same:
            out['issues'].append(f'interval endpoints: SymPy {comp[:2]}, engine {want[:2]}')
        else:
            for k in (0, 1):
                if math.isfinite(want[k]) and comp[2 + k] != want[2 + k]:
                    out['issues'].append(f'{"left" if k == 0 else "right"} endpoint {want[k]:.4f}: SymPy {"closed" if comp[2 + k] else "open"}, engine {"closed" if want[2 + k] else "open"}')
    return out


def main():
    n = 0; problems = []; methods = {}
    for line in sys.stdin:
        line = line.strip()
        if not line:
            continue
        rec = json.loads(line); n += 1
        try:
            r = check(rec)
        except Exception as e:
            r = {'id': rec['id'], 'family': rec['family'], 'issues': [f'could not check: {e}']}
        methods[r.get('method', 'none')] = methods.get(r.get('method', 'none'), 0) + 1
        if r['issues']:
            problems.append(r)
    print(f'problems checked: {n}; problems with issues: {len(problems)}')
    for r in problems[:25]:
        print(r['id'], '|', '; '.join(r['issues']))
    sys.exit(1 if problems else 0)


if __name__ == '__main__':
    main()
