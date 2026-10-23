'use strict';
// Conservative development census. A missing static reference is not dead-code proof.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),zlib=require('node:zlib'),{execFileSync}=require('node:child_process');
const {createRequire}=require('node:module');
const local=createRequire(path.resolve(__dirname,'../localization/package.json')),palette=createRequire(path.resolve(__dirname,'../palette/package.json'));
const acorn=local('acorn'),parse5=local('parse5'),postcss=palette('postcss'),values=palette('postcss-value-parser');
const ROOT=path.resolve(__dirname,'../..'),BASE='c4536e9edd60003efb0a9087ec60915d4c070bdd';
const sha=raw=>crypto.createHash('sha256').update(raw).digest('hex');
const literal=n=>n?.type==='Literal'&&typeof n.value==='string'?n.value:n?.type==='TemplateLiteral'&&n.expressions.length===0?n.quasis[0].value.cooked:null;
function walk(n,visit,anc=[]){if(!n||typeof n!=='object')return;if(n.type)visit(n,anc);for(const [k,v] of Object.entries(n)){if(['loc','start','end','raw'].includes(k))continue;if(Array.isArray(v))for(const x of v)walk(x,visit,[...anc,n]);else if(v&&typeof v==='object')walk(v,visit,[...anc,n]);}}
function analyze(sources){
 const result={schemaVersion:1,files:[],resources:[],globals:[],functions:[],calls:[],events:[],asyncSources:[],styleWrites:[],selectors:[],domConstruction:[],domTokens:[],cssRules:[],cssLayers:[],identifierCounts:{},limitations:[
  'AST references are syntactic, not a scope-resolved proof of reachability.',
  'Computed properties, dynamic selectors and interpolated HTML are retained for manual review.',
  'DOM selector matches and Chromium coverage describe only observed scenarios; absence never authorises removal.',
  'Generated filled HTML and vendor code are fingerprinted separately, not counted again as application source.'
 ]};
 const identifiers=new Map();
 function row(file,line,extra={}){return {file,line,...extra};}
 function js(text,file,offset=0,context='script'){
  let ast;try{ast=acorn.parse(text,{ecmaVersion:'latest',sourceType:'script',allowReturnOutsideFunction:true,locations:true});}catch(error){throw Error(file+':'+(offset+(error.loc?.line||1))+': '+error.message);}
  const snip=n=>n?text.slice(n.start,n.end).replace(/\s+/g,' ').slice(0,180):null;
  const name=n=>n?.type==='Identifier'?n.name:n?.type==='MemberExpression'?[name(n.object),n.computed?literal(n.property):n.property.name].filter(x=>x!==null).join('.'):literal(n);
  const fnName=(n,parent)=>n.id?.name||(parent?.type==='VariableDeclarator'?name(parent.id):parent?.type==='Property'?name(parent.key):parent?.type==='AssignmentExpression'?name(parent.left):null)||'<anonymous>';
  const fnIds=new Map();
  walk(ast,(n,anc)=>{
   const at=offset+n.loc.start.line;
   if(['FunctionDeclaration','FunctionExpression','ArrowFunctionExpression'].includes(n.type)){
    const own=fnName(n,anc.at(-1)),id=file+':'+(n.start)+':'+context+':'+offset;
    fnIds.set(n,id);result.functions.push(row(file,at,{id,name:own,context,offset:n.start,end:n.end,async:!!n.async}));
    if(n.type==='FunctionDeclaration'&&anc.at(-1)?.type==='Program')result.globals.push(row(file,at,{name:n.id.name,kind:'function',context}));
   }
   if(n.type==='VariableDeclaration'&&anc.at(-1)?.type==='Program')for(const d of n.declarations)if(d.id.type==='Identifier')result.globals.push(row(file,at,{name:d.id.name,kind:n.kind,context}));
   if(n.type==='Identifier')identifiers.set(n.name,(identifiers.get(n.name)||0)+1);
   if(n.type==='AssignmentExpression'&&n.left.type==='MemberExpression'&&(/^(?:window|root|globalThis)\./.test(name(n.left)||'')||['window','root','globalThis'].includes(name(n.left.object))))result.globals.push(row(file,at,{name:name(n.left)||(snip(n.left)),kind:'potential-global-member-assignment',context,computed:n.left.computed,aliasNotScopeResolved:true}));
   if(n.type==='CallExpression'){
    const callee=name(n.callee)||'<dynamic>',method=n.callee.type==='MemberExpression'?(n.callee.computed?literal(n.callee.property):n.callee.property.name):null;
    const caller=[...anc].reverse().find(x=>['FunctionDeclaration','FunctionExpression','ArrowFunctionExpression'].includes(x.type));
    result.calls.push(row(file,at,{caller:caller?fnIds.get(caller):null,callee,dynamic:callee==='<dynamic>'}));
    if(['addEventListener','removeEventListener'].includes(method))result.events.push(row(file,at,{kind:method,event:literal(n.arguments[0]),eventExpression:literal(n.arguments[0])===null?snip(n.arguments[0]):null,target:snip(n.callee.object),handler:snip(n.arguments[1]),options:snip(n.arguments[2]),context}));
    if(['querySelector','querySelectorAll','getElementById','getElementsByClassName','closest','matches'].includes(method))result.selectors.push(row(file,at,{method,value:literal(n.arguments[0]),dynamic:literal(n.arguments[0])===null,expression:literal(n.arguments[0])===null?snip(n.arguments[0]):null,context}));
    if(['createElement','createElementNS','insertAdjacentHTML','setAttribute'].includes(method))result.domConstruction.push(row(file,at,{kind:method,arguments:n.arguments.map(x=>literal(x)),dynamic:n.arguments.some(x=>literal(x)===null),context}));
    if(['setTimeout','setInterval','requestAnimationFrame','cancelAnimationFrame','clearTimeout','clearInterval','queueMicrotask'].includes(method||callee))result.asyncSources.push(row(file,at,{kind:method||callee,context}));
    if(['setProperty','removeProperty','insertRule','replaceSync'].includes(method))result.styleWrites.push(row(file,at,{kind:method,target:snip(n.callee.object),property:literal(n.arguments[0]),priority:literal(n.arguments[2]),dynamic:n.arguments.some(x=>literal(x)===null)}));
    if(['defineProperty','assign'].includes(method)&&['window','root','globalThis'].includes(name(n.arguments[0])))result.globals.push(row(file,at,{name:snip(n.arguments[0])+'.'+(literal(n.arguments[1])||'<dynamic-properties>'),kind:'potential-global-'+method,context,aliasNotScopeResolved:true}));
   }
   if(n.type==='NewExpression'&&/Observer$/.test(name(n.callee)||''))result.asyncSources.push(row(file,at,{kind:name(n.callee),context}));
   if(n.type==='AssignmentExpression'&&n.left.type==='MemberExpression'){
    const property=n.left.computed?literal(n.left.property):n.left.property.name;
    if(/^on[a-z]+$/.test(property||''))result.events.push(row(file,at,{kind:'property-handler',event:property.slice(2),target:snip(n.left.object),handler:snip(n.right),context}));
    if(['innerHTML','outerHTML','textContent','className'].includes(property))result.domConstruction.push(row(file,at,{kind:property,dynamic:literal(n.right)===null,context}));
    if(/\.style(?:\.|\[)/.test(snip(n.left)||''))result.styleWrites.push(row(file,at,{kind:'style-assignment',target:snip(n.left),dynamic:literal(n.right)===null}));
   }
   if((n.type==='Literal'||n.type==='TemplateLiteral')&&typeof (literal(n)||n.quasis?.map(x=>x.value.cooked).join('__DYNAMIC__'))==='string'){
    const value=literal(n)??n.quasis.map(x=>x.value.cooked).join('__DYNAMIC__');
    if(/<\/?[a-z][\s\S]*>/i.test(value))html(value,file,at-1,true);
    if(/(?:^|\/)[\w.-]+\.(?:js|css|woff2|svg|png|webp)(?:[?#].*)?$/.test(value)&&!value.includes('\n'))result.resources.push(row(file,at,{kind:'js-resource-literal',value,dynamic:n.type==='TemplateLiteral'&&n.expressions.length>0}));
   }
  });
 }
 function html(text,file,offset=0,fragment=false){
  const ast=(fragment?parse5.parseFragment:parse5.parse)(text,{sourceCodeLocationInfo:true});
  function visit(n){
   const attrs=Object.fromEntries((n.attrs||[]).map(a=>[a.name,a.value])),loc=n.sourceCodeLocation,line=offset+(loc?.startLine||1);
   if(attrs.style)result.styleWrites.push(row(file,line,{kind:'inline-style-attribute',target:n.tagName+(attrs.id?'#'+attrs.id:''),value:attrs.style.slice(0,180),dynamic:fragment,important:attrs.style.includes('!important')}));
   for(const key of ['id','class'])if(attrs[key])for(const value of key==='class'?attrs[key].split(/\s+/):[attrs[key]])if(value)result.domTokens.push(row(file,line,{kind:key,value,dynamic:fragment,interpolated:value.includes('__DYNAMIC__')}));
   for(const [key,value] of Object.entries(attrs)){
    if(/^on[a-z]+$/.test(key)){result.events.push(row(file,line,{kind:fragment?'template-inline-handler':'inline-handler',event:key.slice(2),handler:value,context:n.tagName}));js(value,file,line-1,'inline-handler');}
    if((n.tagName==='script'&&key==='src')||(n.tagName==='link'&&key==='href')||['src','poster'].includes(key))result.resources.push(row(file,line,{kind:n.tagName,value,dynamic:fragment}));
   }
   if(!fragment&&n.tagName==='script'&&!attrs.src&&(!attrs.type||['text/javascript','module'].includes(attrs.type))&&loc?.endTag)js(text.slice(loc.startTag.endOffset,loc.endTag.startOffset),file,offset+loc.startTag.endLine-1,'inline-script');
   if(!fragment&&n.tagName==='style'&&loc?.endTag)css(text.slice(loc.startTag.endOffset,loc.endTag.startOffset),file,offset+loc.startTag.endLine-1);
   for(const c of n.childNodes||[])visit(c);if(n.content)visit(n.content);
  }visit(ast);
 }
 function css(text,file,offset=0){
  const ast=postcss.parse(text,{from:file});
  ast.walkDecls(decl=>values(decl.value).walk(node=>{if(node.type==='function'&&node.value.toLowerCase()==='url'){const value=values.stringify(node.nodes).replace(/^['"]|['"]$/g,'');result.resources.push(row(file,offset+decl.source.start.line,{kind:'css-url',value:value.startsWith('data:')?'data:[embedded]':value,dynamic:value.includes('__DYNAMIC__')}));}}));
  ast.walkAtRules(rule=>{if(rule.name==='layer')result.cssLayers.push(row(file,offset+rule.source.start.line,{params:rule.params,statement:!rule.nodes}));if(rule.name==='import')result.resources.push(row(file,offset+rule.source.start.line,{kind:'css-import',value:rule.params,dynamic:false}));});
  ast.walkRules(rule=>{
   const context=[];for(let p=rule.parent;p&&p.type!=='root';p=p.parent)if(p.type==='atrule')context.unshift('@'+p.name+' '+p.params);
   const declarations=[];rule.each(n=>{if(n.type==='decl')declarations.push({property:n.prop,value:n.value,important:!!n.important});});
   result.cssRules.push(row(file,offset+rule.source.start.line,{selectors:rule.selectors,context,important:declarations.filter(x=>x.important).length,declarations,signature:sha(JSON.stringify({selectors:rule.selectors,context,declarations})),start:rule.source.start.offset,end:rule.source.end.offset}));
  });
 }
 for(const {name,text} of sources){
  const raw=Buffer.from(text);result.files.push({file:name,bytes:raw.length,gzipBytes:zlib.gzipSync(raw,{level:9}).length,brotliBytes:zlib.brotliCompressSync(raw).length,lines:text.split('\n').length,sha256:sha(raw)});
  if(/\.js$/i.test(name))js(text,name);else if(/\.css$/i.test(name))css(text,name);else if(/\.html$/i.test(name))html(text,name);
 }
 result.identifierCounts=Object.fromEntries([...identifiers].sort(([a],[b])=>a.localeCompare(b,'en')));
 const groups=new Map();for(const rule of result.cssRules){const key=rule.file+':'+rule.signature;if(!groups.has(key))groups.set(key,[]);groups.get(key).push(rule);}
 result.exactDuplicateCssGroups=[...groups].filter(([,rows])=>rows.length>1).map(([key,rows])=>({file:key.slice(0,key.indexOf(':')),selectors:rows[0].selectors,context:rows[0].context,occurrences:rows.map(({line,start,end})=>({line,start,end})),status:'review-required; cascade and generated source must be checked'}));
 const cascade=new Map();for(const rule of result.cssRules)for(const selector of rule.selectors)for(const decl of rule.declarations){const key=JSON.stringify([selector,rule.context,decl.property,decl.important]);if(!cascade.has(key))cascade.set(key,[]);cascade.get(key).push({file:rule.file,line:rule.line,start:rule.start,value:decl.value});}
 result.cascadeOverrides=[...cascade].filter(([,rows])=>new Set(rows.map(x=>x.value)).size>1).map(([key,rows])=>{const [selector,context,property,important]=JSON.parse(key);return {selector,context,property,important,occurrences:rows,status:'multiple values; review order/layer/media, not automatic dead-code removal'};});
 result.summary={files:result.files.length,bytes:result.files.reduce((s,f)=>s+f.bytes,0),functions:result.functions.length,globalDeclarationAndAssignmentSites:result.globals.length,callSites:result.calls.length,eventSites:result.events.length,dynamicEventSites:result.events.filter(x=>x.event===null).length,asyncSources:result.asyncSources.length,styleWriteSites:result.styleWrites.length,selectorSites:result.selectors.length,dynamicSelectorSites:result.selectors.filter(x=>x.dynamic).length,domConstructionSites:result.domConstruction.length,cssRules:result.cssRules.length,importantDeclarations:result.cssRules.reduce((s,x)=>s+x.important,0),exactDuplicateCssGroups:result.exactDuplicateCssGroups.length,cascadeOverrideGroups:result.cascadeOverrides.length};
 return result;
}
function capture(root=ROOT){
 const tracked=execFileSync('git',['ls-tree','-r','--name-only',BASE],{cwd:root,encoding:'utf8'}).trim().split('\n');
 const names=tracked.filter(f=>/^(?:nomad360_|portfolio_v2_).*\.(?:js|css)$/.test(f)||['Marketing_calc.HTML','US_Retail_Demo.HTML'].includes(f)||/^(?:en|ru|kk|license)\/.*\.html$/.test(f)||/^assets\/nomad360-[^/]+\.(?:js|css)$/.test(f));
 const sources=names.map(name=>{
  const expected=execFileSync('git',['show',BASE+':'+name],{cwd:root,maxBuffer:20*1024*1024}),actual=fs.readFileSync(path.join(root,name));
  if(!expected.equals(actual))throw Error('Frozen audit source changed: '+name);return {name,text:actual.toString()};
 });
 const data=analyze(sources);data.baseRevision=BASE;
 const known=new Set(tracked);
 data.dependencyEdges=data.resources.map(ref=>{
  let value=ref.value.replace(/^url\(['"]?|['"]?\)$/g,'').replace(/^['"]|['"]$/g,'');
  const project='https://kazartsevev.github.io/shelter-partner-directory/';
  if(value.startsWith(project))value=value.slice(project.length);
  else if(/^(?:https?:|data:|\/\/)/.test(value))return {from:ref.file,line:ref.line,kind:ref.kind,to:value.startsWith('data:')?'data:[embedded]':value,status:'external-or-embedded'};
  value=value.split(/[?#]/)[0];
  const to=path.posix.normalize(value.startsWith('/')?value.replace(/^\/shelter-partner-directory\//,'/').slice(1):path.posix.join(path.posix.dirname(ref.file),value));
  return {from:ref.file,line:ref.line,kind:ref.kind,to,status:known.has(to)?'tracked':'unresolved-or-computed',dynamic:ref.dynamic};
 });
 data.additionalFingerprints=tracked.filter(f=>/^US_Retail_Demo.*FILLED\.html$/.test(f)||f==='scripts/palette/build.cjs'||/^vendor\/.*\.(?:js|css)$/.test(f)).map(file=>{const raw=fs.readFileSync(path.join(root,file));return {file,bytes:raw.length,sha256:sha(raw),reason:file.includes('FILLED')?'generated standalone; runtime audit separately; not duplicate AST input':file.startsWith('vendor/')?'third-party implementation; not application dead-code candidate':'palette generator; review alongside generated CSS'};});
 data.toolVersions={acorn:local('acorn/package.json').version,parse5:JSON.parse(fs.readFileSync(path.join(path.dirname(local.resolve('parse5')),'../../package.json'))).version,postcss:palette('postcss/package.json').version};
 return data;
}
if(require.main===module){const output=process.argv[2];if(!output)throw Error('Usage: node scripts/audit/runtime-inventory.cjs output.json');const data=capture();fs.mkdirSync(path.dirname(output),{recursive:true});fs.writeFileSync(output,JSON.stringify(data,null,2)+'\n');console.log('RUNTIME_INVENTORY_GREEN',JSON.stringify(data.summary));}
module.exports={analyze,capture,BASE,sha};
