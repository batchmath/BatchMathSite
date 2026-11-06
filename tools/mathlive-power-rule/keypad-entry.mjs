import assert from 'node:assert/strict';
// Test helper: enter a restricted AST using only the real visible keypad.
// No MathLive insert(), source writes or physical keyboard entry here.
export async function enterWithKeypad(page,tree,{dom=false}={}){
  const pad=page.locator('.bm-calc-keypad:visible');
  const activate=button=>dom?button.evaluate(b=>{if(!b.getClientRects().length||b.disabled)throw Error('Visible enabled button required');b.click();}):button.click();
  const press=label=>activate(pad.locator('button').filter({hasText:new RegExp('^'+label.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'$')}));
  const fraction=()=>activate(pad.locator('[aria-label="Insert stacked fraction"]'));
  async function visit(n){
    switch(n.type){
      case 'num':for(const ch of n.raw)await press(ch);return;
      case 'sym':await press(n.name==='pi'?'π':n.name);return;
      case 'group':await press('(');await visit(n.value);await press(')');return;
      case 'unary':await press(n.op==='-'?'−':'+');await visit(n.value);return;
      case 'fraction':await fraction();await visit(n.numerator);await press('↓');await visit(n.denominator);await press('→');return;
      case 'call':
        if(n.name==='root'){assert.equal(n.args.length,2);await press('ⁿ√');await visit(n.args[0]);await press('→');await visit(n.args[1]);await press('→');return;}
        assert.equal(n.args.length,1);await press(n.name==='sqrt'?'√':n.name);await visit(n.args[0]);await press('→');return;
      case 'binary':
        if(n.op==='^'){await visit(n.left);await press('xⁿ');await visit(n.right);await press('→');return;}
        if(n.op==='/'){await fraction();await visit(n.left);await press('↓');await visit(n.right);await press('→');return;}
        await visit(n.left);await press(n.op==='*'?'·':n.op==='-'?'−':n.op);await visit(n.right);return;
      default:throw Error('Unsupported test tree '+n.type);
    }
  }
  await press('Clear');await visit(tree);
}
