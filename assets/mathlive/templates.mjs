// Editable insertion capabilities, independent of any engine/grading contract.
export const templates=Object.freeze({
  sum:'\\sum_{k=1}^{n}\\left(#?\\right)',
  limit:'\\lim_{n\\to\\infty}\\left(#?\\right)',
  indefinite:'\\int #?\\,\\mathrm{d}x',
  definite:'\\int_{#?}^{#?}#?\\,\\mathrm{d}x',
  double:'\\iint_{#?}#?\\,\\mathrm{d}A',
  subscript:'x_{#?}',delta:'\\Delta x',arrow:'\\to',infinity:'\\infty'
});
export function insertTemplate(field,name){
  if(!Object.hasOwn(templates,name))throw Error('Unknown notation template.');
  field.insert(templates[name]);
}
