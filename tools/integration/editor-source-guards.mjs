// Narrow source-preservation allowance for the two authorized mirror-focus
// routes. Parsing, expression editing, token serialization and grading remain
// subject to the original exact comparisons and independent functional tests.
export function withoutHiddenInputFocusRoutes(source) {
  return source
    .replace('\n      input.focus=()=>{if(!input.disabled)activateBinding(binding,true);};','')
    .replace('\n    input.focus=()=>{if(!input.disabled)editor.focus({preventScroll:true});};','');
}
