#!/usr/bin/env python3
"""Equivalent forms of Unit 5 function answers, for the acceptance test (equivalence.mjs).
Reads JSON lines {id, expr} (expressions in x, engine syntax) and writes {id, variants: [...]} with SymPy rewrites
(expanded, factored, combined over a common denominator, exponentials and logarithms recombined) in plain keypad
syntax: ^ for powers, ln, e^(...), sqrt, abs. Only forms that are actually different strings are kept."""
import json, sys
import sympy as sp
from sympy.parsing.sympy_parser import parse_expr, standard_transformations, implicit_multiplication_application
x = sp.Symbol('x', real=True)
T = standard_transformations + (implicit_multiplication_application,)
LOCAL = {'x': x, 'e': sp.E, 'ln': sp.log, 'abs': sp.Abs, 'asin': sp.asin, 'acos': sp.acos, 'atan': sp.atan,
         'cbrt': lambda a: sp.real_root(a, 3), 'sqrt': sp.sqrt, 'pi': sp.pi}

def to_text(e):
    s = sp.sstr(e)
    s = s.replace('**', '^').replace('log(', 'ln(').replace('Abs(', 'abs(')
    s = s.replace('exp(', 'e^(').replace('E', 'e')
    return s

for line in sys.stdin:
    rec = json.loads(line)
    try:
        e = parse_expr(rec['expr'].replace('^', '**'), local_dict=LOCAL, transformations=T)
    except Exception as err:
        print(json.dumps({'id': rec['id'], 'variants': [], 'error': str(err)})); continue
    out = set()
    for f in (sp.expand, sp.factor, sp.together, lambda u: sp.powsimp(sp.expand(u)), lambda u: sp.expand_log(u, force=True), sp.cancel):
        try:
            v = f(e)
            if v.has(sp.Piecewise, sp.sign, sp.real_root):  # keep to forms a student would type
                continue
            out.add(to_text(v))
        except Exception:
            pass
    out.discard(rec['expr'])
    print(json.dumps({'id': rec['id'], 'variants': sorted(out)[:6]}))
