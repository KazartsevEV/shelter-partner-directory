'use strict';
const {test}=require('node:test'),A=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {execFileSync}=require('node:child_process');
const acorn=require('../scripts/localization/node_modules/acorn');
const {manifest,digest,restore}=require('./helpers/v1-engine-scope.cjs');
const functionSource=require('./helpers/v1-function-source.cjs');
const root=path.resolve(__dirname,'..');
function declarations(html){
 const script=[...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)].find(m=>m[1].includes('function calculateProductPortfolio()'))[1];
 return Object.fromEntries(acorn.parse(script,{ecmaVersion:'latest'}).body
  .filter(n=>n.type==='FunctionDeclaration').map(n=>[n.id.name,{node:n,source:script.slice(n.start,n.end)}]));
}
test('all 18 extracted financial functions remain byte-identical to accepted main in both entrypoints',()=>{
 A.equal(manifest.names.length,18);
 for(const file of Object.keys(manifest.html)){
  const old=execFileSync('git',['show',manifest.base+':'+file],{cwd:root,encoding:'utf8',maxBuffer:2*1024*1024});
  const previous=declarations(old),current=require('./helpers/tax-draft-storage-scope.cjs').restore(file,fs.readFileSync(path.join(root,file),'utf8')),now=declarations(current);
  A.equal(digest(old),manifest.html[file].before);A.equal(digest(current),manifest.html[file].after);
  let reverted=current;
  for(const name of manifest.names){
   A.equal(functionSource(name),previous[name].source,file+': '+name+' formula changed');
   A.equal(digest(functionSource(name)),manifest.functions[name]);
   A.equal(now[name].node.body.body.length,1,name+' UI must only delegate');
   A.equal(now[name].node.body.body[0].type,'ReturnStatement');
   const marker=new RegExp('/\\* V1-ENGINE-DELEGATE-BEGIN:'+name+' \\*/[\\s\\S]*?/\\* V1-ENGINE-DELEGATE-END:'+name+' \\*/');
   A.match(reverted,marker);reverted=reverted.replace(marker,functionSource(name));
  }
  for(const name of ['calculate','unassignedAgentExpenseKeys'])reverted=reverted.replace(now[name].source,previous[name].source);
  reverted=reverted.replace(now.v1FinancialEngine.source+'\n\n        ','')
   .replace('    <script src="./nomad360_v1_engine.js"></script>\n','');
  A.equal(reverted,old,file+': changed outside the reviewed engine boundary');
  A.equal(restore(file,current),old);
  A.throws(()=>restore(file,current.replace('calculateProductPortfolio()','calculateChanged()')),/Unreviewed (?:V1 extraction|tax\/draft storage|partner application HTML)/);
 }
});
test('canonical engine has no browser, persistence, transport or localization dependencies',()=>{
 const source=fs.readFileSync(path.join(root,'nomad360_v1_engine.js'),'utf8');
 A.equal(digest(source),manifest.moduleSha256);
 const forbidden=new Set(['window','document','localStorage','sessionStorage','fetch','navigator','XMLHttpRequest','Nomad360UI','Nomad360LocaleCore']);
 function visit(node){if(!node||typeof node!=='object')return;if(node.type==='Identifier')A.equal(forbidden.has(node.name),false,node.name+' in engine');for(const child of Object.values(node))if(Array.isArray(child))child.forEach(visit);else if(child&&typeof child==='object')visit(child);}
 visit(acorn.parse(source,{ecmaVersion:'latest'}));
});

test('simple online extraction preserves the accepted arithmetic expressions, including UI-derived ratios',()=>{
 const old=execFileSync('git',['show',manifest.base+':Marketing_calc.HTML'],{cwd:root,encoding:'utf8',maxBuffer:2*1024*1024});
 const previous=declarations(old).calculate.source;
 const current=declarations(fs.readFileSync(path.join(root,'Marketing_calc.HTML'),'utf8')).calculate.source;
 const module=acorn.parse(fs.readFileSync(path.join(root,'nomad360_v1_engine.js'),'utf8'),{ecmaVersion:'latest'});
 function walk(node,visit){if(!node||typeof node!=='object')return;visit(node);for(const child of Object.values(node))if(Array.isArray(child))child.forEach(n=>walk(n,visit));else if(child&&typeof child==='object')walk(child,visit);}
 const extracted=[];walk(module,n=>{if(n.type==='FunctionDeclaration'&&['calculateSimpleService','validateSimpleService','unassignedSimpleAgentExpenses'].includes(n.id.name))extracted.push(n);});
 const canonical=n=>JSON.stringify(n,(key,value)=>['start','end','raw'].includes(key)?undefined:value);
 function containsText(node){let text=false;walk(node,n=>{if(n.type==='TemplateLiteral'||n.type==='Literal'&&typeof n.value==='string')text=true;});return text;}
 function arithmetic(nodes){const expressions=new Set();for(const node of nodes)walk(node,n=>{if(n.type==='BinaryExpression'&&['+','-','*','/','%','**'].includes(n.operator)&&!containsText(n))expressions.add(canonical(n));});return [...expressions].sort();}
 A.deepEqual(arithmetic([acorn.parse(current,{ecmaVersion:'latest'}),...extracted]),
  arithmetic([acorn.parse(previous,{ecmaVersion:'latest'})]));
});
