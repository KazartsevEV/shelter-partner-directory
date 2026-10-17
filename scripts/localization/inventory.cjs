'use strict';
// Conservative source census, not a translator or proof of linguistic quality.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const acorn=require('acorn'),html=require('parse5');
const ROOT=path.resolve(__dirname,'../..'),OUT='docs/localization/l0';
const norm=s=>s.replace(/\s+/g,' ').trim(),sha=s=>crypto.createHash('sha256').update(s).digest('hex');
const attrs=new Set(['placeholder','title','aria-label','aria-description','aria-placeholder','aria-valuetext','alt','label']);
function walk(node,visit,anc=[]){
 if(!node||typeof node!=='object')return;
 if(node.type)visit(node,anc);
 for(const [key,v] of Object.entries(node)){
  if(['start','end','loc','raw'].includes(key))continue;
  if(Array.isArray(v))v.forEach(x=>walk(x,visit,[...anc,node]));
  else if(v&&typeof v==='object')walk(v,visit,[...anc,node]);
 }
}
const str=n=>n?.type==='Literal'&&typeof n.value==='string'?n.value:null;
const key=n=>n?.key?.name??n?.key?.value;
function flatten(n,prefix='',out={}){
 if(n?.type==='ObjectExpression')for(const p of n.properties){
  if(p.type!=='Property')continue;const k=prefix?prefix+'.'+key(p):String(key(p));
  if(str(p.value)!==null)out[k]=p.value;
  else if(['ObjectExpression','ArrayExpression'].includes(p.value.type))flatten(p.value,k,out);
 }else if(n?.type==='ArrayExpression')n.elements.forEach((item,index)=>{
  const k=prefix+'.'+index;if(str(item)!==null)out[k]=item;else flatten(item,k,out);
 });return out;
}
function build(root=ROOT){
 const entries=[],sources=[],catalogs=[],patterns=[],excluded=[],assetSet=new Set(['Marketing_calc.HTML']);
 const contents=new Map(),dictionaryNodes=new Map(),core=new Map(),dictionaryIssues=[];
 const load=f=>{if(!contents.has(f)){
  let source=fs.readFileSync(path.join(root,f),'utf8');
  // One passive Task10 style link adds no user copy. Preserve historical
  // text offsets while still scanning the referenced stylesheet itself.
  if(f==='Marketing_calc.HTML'&&source.includes('nomad360_palette.css')){
   assetSet.add('nomad360_palette.css');
   source=require('../../tests/helpers/task10-palette-scope.cjs').stripTask10PaletteHtml(source);
  }
  // Preserve the translated-copy baseline: the approved logo color/crop
  // insertion contains no new translatable user-facing content.
  if(f==='nomad360_header.js'||f==='nomad360_calculator_ui.css')
   source=require('../../tests/helpers/task10-logo-scope.cjs').stripTask10Logo(f,source);
  contents.set(f,source);
 }return contents.get(f);};
 function stage(f,context=''){
  if(/locale_core/.test(f))return 'L1';
  if(/header|price_export|calculator_ui/.test(f)||/print|export|embed|download|save/i.test(context))return 'L5';
  if(/portfolio_v2|payment|fx/.test(f))return 'L4';
  if(/service|agent|calculate$/i.test(context))return 'L3';
  return 'L2';
 }
 function add(f,kind,text,offset,context='',extra={}){
  const source=load(f),line=source.slice(0,offset).split('\n').length;
  entries.push({id:f+':'+offset+':'+kind,file:f,line,offset,kind,owner:f,stage:stage(f,context),context,text,...extra});
 }
 function htmlScan(raw,f,base=0,fragment=false,embedded=false){
  const ast=fragment?html.parseFragment(raw,{sourceCodeLocationInfo:true}):html.parse(raw,{sourceCodeLocationInfo:true});
  function visit(n,parents=[]){
   const loc=n.sourceCodeLocation,tag=n.tagName;
   const context=[...parents.map(p=>p.attrs?.find(a=>a.name==='id')?.value).filter(Boolean),n.attrs?.find(a=>a.name==='id')?.value].filter(Boolean).at(-1)||tag||parents.at(-1)?.tagName||'document';
   const protectedNode=[...parents,n].some(p=>p.attrs?.some(a=>a.name==='data-nomad-no-translate'||a.name==='contenteditable'&&a.value==='true'));
   if(n.nodeName==='#text'&&loc&&!parents.some(p=>['script','style','noscript'].includes(p.tagName))&&norm(n.value))
    add(f,embedded?'markup-text':'html-text',norm(n.value),base+loc.startOffset,context,{protectedNode,embedded});
   for(const a of n.attrs||[]){
    const extraAttr=(tag==='meta'&&a.name==='content')||(tag==='input'&&a.name==='value'&&n.attrs.some(x=>x.name==='type'&&['button','submit','reset'].includes(x.value)));
    if((attrs.has(a.name)||extraAttr)&&norm(a.value))add(f,embedded?'markup-attribute':'html-attribute',a.value,base+(loc?.attrs?.[a.name]?.startOffset||0),context,{attribute:a.name,protectedNode,embedded});
    if(f==='Marketing_calc.HTML'&&!fragment&&((tag==='script'&&a.name==='src')||(tag==='link'&&a.name==='href'&&n.attrs.some(x=>x.name==='rel'&&x.value==='stylesheet')))){
     if(/^\.\//.test(a.value)&&!a.value.startsWith('./vendor/'))assetSet.add(a.value.slice(2).split('?')[0]);
     else excluded.push({resource:a.value,reason:a.value.startsWith('./vendor/')?'third-party XLSX implementation, no application copy':'external resource; source and language not controlled by application'});
    }
   }
   if(!fragment&&tag==='script'&&!n.attrs?.some(a=>a.name==='src')&&loc){
    const from=loc.startTag.endOffset,to=loc.endTag?.startOffset||loc.endOffset;
    jsScan(raw.slice(from,to),f,base+from);
   }
   if(!fragment&&tag==='style'&&loc)cssScan(raw.slice(loc.startTag.endOffset,loc.endTag.startOffset),f,base+loc.startTag.endOffset);
   for(const c of n.childNodes||[])visit(c,[...parents,n]);
   if(n.content)visit(n.content,[...parents,n]);
  }visit(ast);
 }
 function cssScan(raw,f,base=0){
  for(const m of raw.matchAll(/\bcontent\s*:\s*(['"])((?:\\.|(?!\1)[\s\S])*?)\1/g))add(f,'css-content',m[2],base+m.index,'generated content');
 }
 function jsScan(raw,f,base=0){
  const ast=acorn.parse(raw,{ecmaVersion:'latest',sourceType:'script',locations:true});
  const own=new Map();dictionaryNodes.set(f,[...(dictionaryNodes.get(f)||[]),own]);
  walk(ast,(n,anc)=>{
   if(f==='nomad360_locale_core.js'&&n.type==='ArrayExpression'&&n.elements.length===4&&n.elements.every(x=>str(x)!==null)&&/^[a-z][a-zA-Z0-9]+(?:\.[a-zA-Z0-9_-]+)+$/.test(str(n.elements[0]))){
    const [id,en,ru,kk]=n.elements.map(str);
    core.set(norm(ru),{id,ru,en,kk});catalogs.push({id,file:f,line:raw.slice(0,n.start).split('\n').length,kind:'semantic-message',translations:{ru,en,kk}});
    n.elements.slice(1).forEach((x,i)=>own.set(x.start,{catalog:id,language:['en','ru','kk'][i]}));
    if(!['interface.shell.privacy','interface.header.products.1.goal'].includes(id)&&[en,ru,kk].some(x=>!x.trim()))dictionaryIssues.push({file:f,key:id,issue:'missing semantic language'});
   }
   if(f==='nomad360_locale_core.js'&&n.type==='ArrayExpression'&&n.elements.length===3&&n.elements.every(x=>str(x)!==null)&&/[А-Яа-яЁё]/.test(str(n.elements[0]))){
    const [ru,en,kk]=n.elements.map(str),id='legacy:'+sha(ru).slice(0,16);
    const previous=core.get(norm(ru));
    if(previous&&(previous.en!==en||previous.kk!==kk))dictionaryIssues.push({file:f,line:raw.slice(0,n.start).split('\n').length,issue:'conflicting duplicate',ru});
    core.set(norm(ru),{id,ru,en,kk});catalogs.push({id,file:f,line:raw.slice(0,n.start).split('\n').length,kind:'legacy-row',translations:{ru,en,kk}});
    n.elements.forEach((x,i)=>own.set(x.start,{catalog:id,language:['ru','en','kk'][i]}));
   }
   if(n.type==='ObjectExpression'){
    const props=n.properties.filter(p=>p.type==='Property'),langs=['ru','en','kk'];
    if(!langs.every(l=>props.some(p=>key(p)===l&&p.value.type==='ObjectExpression')))return;
    const leaves=Object.fromEntries(langs.map(l=>[l,flatten(props.find(p=>key(p)===l).value)]));
    const scope=anc.findLast(x=>x.type==='VariableDeclarator')?.id?.name||'inline';
    const keys=new Set(langs.flatMap(l=>Object.keys(leaves[l])));
    for(const k of [...keys].sort()){
     const id=f+':'+scope+':'+n.start+':'+k,translations={};
     for(const l of langs){const value=leaves[l][k];translations[l]=value?str(value):null;if(value)own.set(value.start,{catalog:id,language:l});}
     catalogs.push({id,file:f,line:load(f).slice(0,base+n.start).split('\n').length,kind:'module-key',key:k,translations});
     if(langs.some(l=>translations[l]===null))dictionaryIssues.push({file:f,key:k,issue:'missing module language',translations});
    }
   }
   if(f==='nomad360_locale_core.js'&&n.type==='ArrayExpression'&&n.elements[0]?.regex&&str(n.elements[1])!==null&&str(n.elements[2])!==null){
    const reg=n.elements[0].regex,id='pattern:'+sha(reg.pattern+reg.flags).slice(0,16);
    patterns.push({id,file:f,line:raw.slice(0,n.start).split('\n').length,regex:reg.pattern,flags:reg.flags,en:str(n.elements[1]),kk:str(n.elements[2]),review:reg.pattern.includes('\\\\d')?'double-escaped digit token; test with a real diagnostic':'anchored variable template; verify captures in L1/L4'});
    n.elements.slice(1,3).forEach((x,i)=>own.set(x.start,{catalog:id,language:['en','kk'][i]}));
   }
  });
  walk(ast,(n,anc)=>{
   const context=anc.findLast(x=>['FunctionDeclaration','FunctionExpression','ArrowFunctionExpression'].includes(x.type))?.id?.name||anc.findLast(x=>x.type==='VariableDeclarator')?.id?.name||'module';
   if(str(n)!==null){
    const text=str(n);if(!norm(text))return;
    add(f,'js-string',text,base+n.start,context,{...own.get(n.start)});
    if(/<\/?[a-z][\s\S]*>/i.test(text))htmlScan(text,f,base+n.start,true,true);
   }else if(n.regex){
    add(f,'js-regex',n.regex.pattern,base+n.start,context,{flags:n.regex.flags,review:'Regex is code, not visible text; variable lookup patterns require capture checks'});
   }else if(n.type==='TemplateLiteral'){
    const text=n.quasis.map((q,i)=>(q.value.cooked??q.value.raw)+(i<n.expressions.length?'⟪'+raw.slice(n.expressions[i].start,n.expressions[i].end)+'⟫':'')).join('');
    add(f,'js-template',text,base+n.start,context,{parameters:n.expressions.map(x=>raw.slice(x.start,x.end)),review:'Dynamic template: captures and user-owned values must be preserved'});
    if(/<\/?[a-z][\s\S]*>/i.test(text))htmlScan(text,f,base+n.start,true,true);
   }
  });
 }
 htmlScan(load('Marketing_calc.HTML'),'Marketing_calc.HTML');
 for(const f of [...assetSet].sort()){
  const raw=load(f);sources.push({file:f,sha256:sha(raw),bytes:Buffer.byteLength(raw),owner:f});
  if(f.endsWith('.js'))jsScan(raw,f);else if(f.endsWith('.css'))cssScan(raw,f);
 }
 for(const e of entries){
  const t=norm(e.text),known=core.get(t);
  if(e.catalog)e.coverage='catalog-entry';
  else if(e.protectedNode)e.coverage='protected-or-component-owned';
  else if(known){e.coverage='legacy-exact';e.catalog=known.id;}
  else if(e.kind==='js-template'||e.kind==='js-regex'&&/[А-Яа-яЁё]/.test(t))e.coverage='dynamic-review';
  else if(e.embedded||/^(html|css)-/.test(e.kind)||/[А-Яа-яЁё]/.test(t))e.coverage='unmapped-candidate';
  else e.coverage='technical-or-latin-review';
  // Inventory keeps machine strings too: reviewers, not heuristics, decide
  // which literals are user-facing. A candidate is never called a proven gap.
 }
 entries.sort((a,b)=>a.file.localeCompare(b.file,'en')||a.offset-b.offset||a.kind.localeCompare(b.kind,'en'));
 const counts={};for(const e of entries)counts[e.coverage]=(counts[e.coverage]||0)+1;
 const summary={schemaVersion:1,scope:'Nomad360 calculator; entrypoint and all locally referenced non-vendor JS/CSS',sources:sources.length,entries:entries.length,catalogRows:catalogs.length,legacyUniqueKeys:core.size,moduleKeys:catalogs.filter(x=>x.kind==='module-key').length,patterns:patterns.length,coverage:counts,dictionaryIssues,excluded,limitations:['Source census includes hidden/conditional code and machine literals; candidates require human triage.','Pattern presence and exact lookup are structural evidence, not semantic or linguistic acceptance.','index.html is the partner directory, outside the calculator scope. External widgets, vendor implementation, licenses and task-6 marketing source docs are excluded explicitly.','Stable legacy hash IDs are inventory identifiers only; semantic runtime-key migration belongs to L1.','L0 does not complete L1–L6 or declare EN canonical.']};
 const catalog={schemaVersion:1,sources,catalogs,patterns,entries};
 const candidates=entries.filter(e=>['unmapped-candidate','dynamic-review'].includes(e.coverage));
 return {catalog,summary,candidates:{schemaVersion:1,description:'Conservative triage backlog, not a count of confirmed missing translations',entries:candidates}};
}
function files(result){
 const {entries,...index}=result.catalog,output={'summary.json':result.summary,'candidates.json':result.candidates},entryFiles=[];
 for(const source of result.catalog.sources){
  const subset=entries.filter(e=>e.file===source.file);
  for(let i=0;i<subset.length;i+=400){
   const name='entries/'+source.file+'/'+String(i/400+1).padStart(3,'0')+'.json';
   output[name]={schemaVersion:1,file:source.file,entries:subset.slice(i,i+400)};entryFiles.push({file:name,owner:source.file,count:Math.min(400,subset.length-i)});
  }
 }
 output['catalog.json']={...index,entryFiles};return output;
}
function main(){const result=build(),check=process.argv.includes('--check');
 const output=files(result);
 for(const [name,data] of Object.entries(output)){
  const target=path.join(ROOT,OUT,name),serialized=JSON.stringify(data,null,2)+'\n';
  if(check){if(!fs.existsSync(target)||fs.readFileSync(target,'utf8')!==serialized)throw Error('Stale L0 inventory: '+name+'; regenerate with node scripts/localization/inventory.cjs');}
  else {fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,serialized);}
 }
 const existing=fs.existsSync(path.join(ROOT,OUT,'entries'))?fs.readdirSync(path.join(ROOT,OUT,'entries'),{recursive:true}).filter(f=>f.endsWith('.json')).map(f=>'entries/'+f):[];
 for(const old of existing)if(!output[old]){if(check)throw Error('Orphan inventory page: '+old);fs.unlinkSync(path.join(ROOT,OUT,old));}
 console.log('LOCALIZATION_L0_SOURCE_GREEN',JSON.stringify(result.summary));
}
if(require.main===module)main();
module.exports={build,files};
