'use strict';
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),{chromium}=require('playwright');
const root=path.resolve(__dirname,'../..'),prefix='/shelter-partner-directory/';
async function serve(source=root){const server=http.createServer((req,res)=>{const u=new URL(req.url,'http://local');if(!u.pathname.startsWith(prefix)){res.writeHead(404);return res.end();}let f=path.resolve(source,decodeURIComponent(u.pathname.slice(prefix.length)));if(fs.existsSync(f)&&fs.statSync(f).isDirectory())f=path.join(f,'index.html');if(!f.startsWith(source+path.sep)||!fs.existsSync(f)){res.writeHead(404);return res.end();}res.setHeader('Content-Type',({'.HTML':'text/html','.html':'text/html','.css':'text/css','.js':'text/javascript','.png':'image/png','.woff2':'font/woff2','.json':'application/json'})[path.extname(f)]||'application/octet-stream');fs.createReadStream(f).pipe(res);});await new Promise(r=>server.listen(0,'127.0.0.1',r));return {base:'http://127.0.0.1:'+server.address().port+prefix,close:()=>new Promise(r=>server.close(r))};}
async function launch(){return chromium.launch({headless:true,args:['--no-sandbox','--force-color-profile=srgb']});}
async function ready(p,base,entry='Marketing_calc.HTML?lang=ru'){
 await p.route('https://**/*',async r=>{const u=new URL(r.request().url());if(u.host==='kazartsevev.github.io'&&u.pathname.startsWith(prefix)){const response=await p.request.get(base+u.pathname.slice(prefix.length));return r.fulfill({response});}return r.abort();});
 await p.goto(base+entry,{waitUntil:'domcontentloaded'});if(entry.startsWith('Marketing_calc.HTML'))await p.addStyleTag({path:path.join(root,'artifacts/task10-palette/utilities.css')});await p.evaluate(()=>document.fonts.ready);await p.waitForTimeout(200);await p.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
}
async function audit(p){return p.evaluate(()=>{
 const approved=new Set(['23,59,88','255,255,255','255,145,63','56,103,139']);
 const rgba=s=>{const m=s.match(/^rgba?\(([^)]+)\)$/);if(!m)return null;const a=m[1].split(',').map(Number);return {rgb:a.slice(0,3).join(','),a:a[3]??1,v:a.slice(0,3)};};
 const allowed=s=>{const a=rgba(s);return !a||a.a===0||a.a===1&&approved.has(a.rgb);};
 const visible=e=>e.checkVisibility({checkOpacity:true,checkVisibilityCSS:true})&&e.getClientRects().length&&!e.closest('[hidden],.hidden,#nomad360-print-sheet');
 const key=e=>e.id?'#'+e.id:e.tagName.toLowerCase()+(typeof e.className==='string'?'.'+e.className.trim().split(/\s+/).slice(0,3).join('.'):'');
 const errors=[],contrast=[],fonts=[],colors={};let count=0;
 const luminance=a=>a.reduce((s,v,i)=>s+([.2126,.7152,.0722][i])*(v/255<=.04045?v/255/12.92:((v/255+.055)/1.055)**2.4),0);
 for(const e of document.querySelectorAll('body *')){if(!visible(e)||e.matches('script,style,link,source'))continue;count++;const s=getComputedStyle(e);if(Number(s.opacity)>0&&Number(s.opacity)<1)errors.push({element:key(e),prop:'opacity',value:s.opacity});if(s.backgroundImage.includes('gradient('))errors.push({element:key(e),prop:'backgroundImage',value:s.backgroundImage});const props=['color','backgroundColor'];for(const side of ['Top','Right','Bottom','Left'])if(parseFloat(s['border'+side+'Width'])&&s['border'+side+'Style']!=='none')props.push('border'+side+'Color');if(s.outlineStyle!=='none')props.push('outlineColor');if(e instanceof SVGElement){if(e.getAttribute('fill')&&e.getAttribute('fill')!=='none')props.push('fill');if(e.getAttribute('stroke')&&e.getAttribute('stroke')!=='none')props.push('stroke');}
 for(const prop of props){const c=s[prop];colors[c]=(colors[c]||0)+1;if(!allowed(c)&&!(prop==='backgroundColor'&&e.id==='nomad360-hero-summary'&&e.closest('#nomad360-commercial-banner')&&c==='rgba(23, 59, 88, 0.3)'))errors.push({element:key(e),prop,color:c,text:e.textContent.trim().slice(0,60)});}
 for(const pseudo of ['::before','::after','::placeholder']){const ps=getComputedStyle(e,pseudo);if(pseudo==='::placeholder'&&!e.matches('input[placeholder],textarea[placeholder]')||pseudo!=='::placeholder'&&['none','normal'].includes(ps.content))continue;for(const prop of ['color','backgroundColor'])if(!allowed(ps[prop]))errors.push({element:key(e)+pseudo,prop,color:ps[prop]});}
 if([...e.childNodes].some(n=>n.nodeType===Node.TEXT_NODE&&n.textContent.trim())){
 if(!s.fontFamily.startsWith('Inter'))fonts.push({element:key(e),font:s.fontFamily});
 if(e.closest('svg,option,.nomad-wordmark,.brand,.nomad-seo-tagline'))continue;
 let bg=null;for(let parent=e;parent;parent=parent.parentElement){const a=rgba(getComputedStyle(parent).backgroundColor);if(a&&a.a===1){bg=a.v;break;}}const floating=e.closest('.nomad-burger');if(floating&&getComputedStyle(floating).position==='fixed'){
 const r=floating.getBoundingClientRect();for(const hit of document.elementsFromPoint(r.left+r.width/2,r.top+r.height/2)){if(hit===floating||floating.contains(hit)||hit.contains(floating))continue;let found=false;for(let parent=hit;parent;parent=parent.parentElement){if(parent.contains(floating))continue;const a=rgba(getComputedStyle(parent).backgroundColor);if(a&&a.a===1){bg=a.v;found=true;break;}}if(found)break;}
 }bg??=[255,255,255];const fg=rgba(s.color);if(fg&&fg.a){const a=luminance(fg.v),b=luminance(bg),ratio=(Math.max(a,b)+.05)/(Math.min(a,b)+.05);if(ratio<4.5)contrast.push({element:key(e),text:e.textContent.trim().slice(0,95),foreground:s.color,background:bg,ratio});}
 }
 }
 return {elements:count,colors,errors,fonts,contrast,overflow:document.documentElement.scrollWidth>innerWidth+1};
 });}
module.exports={root,prefix,serve,launch,ready,audit};
