"""Render registered flags to their actual shared-keypad control labels."""
def labels(p,name=''):
 out=['0–9']
 if p.get('signed') is not False:out.append('−')
 for flag,label in [('decimal','.'),('fraction','stacked fraction'),('radical','√'),('cubeRoot','∛'),('nthRoot','ⁿ√'),('exponent','xⁿ'),('logarithm','ln')]:
  if p.get(flag):out.append(label)
 out += ['π' if c=='pi' else c for c in p.get('constants',[])]
 out += p.get('variables',[]) if isinstance(p.get('variables',[]),list) else ['actual generated variables']
 out += [f[0] for f in p.get('functions',[])]
 if p.get('parentheses'):out += ['(',')']
 if p.get('arithmetic'):out += ['+','·']
 elif p.get('plus'):out += ['+']
 if p.get('equality'):out += ['=']
 out += [x[0] for x in p.get('operators',[])]
 if p.get('list') or p.get('pair'):out += [',']
 if p.get('interval'):
  if p.get('brackets') is not False:out += ['[',']']
  if p.get('union') is not False:out += ['∪']
 if p.get('equation'):out += ['f(x)']
 elif p.get('sequence') or p.get('recursive'):
  out += ['a₁','aₙ']
  if p.get('recursive'):out += ['aₙ₋₁',',']
 if p.get('infinity'):out += ['∞','−∞']
 if p.get('dne'):out += ['DNE']
 if p.get('dna'):out += ['Does not apply']
 if p.get('riemann'):out += ['editable lim / Σ','∞','−∞','subscript','→ (Newton augmentation)']
 if p.get('classification'):out += ['Under','Over']
 return '; '.join(dict.fromkeys(out))+'; cursor/delete/clear/check'
