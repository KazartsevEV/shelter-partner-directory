'use strict';
const A=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'../..');
const {generate,helpPages}=require('./build_pages.cjs'),{cfg,pages,outputs}=generate();
const locales=['en','ru','kk'],topics=['','business-idea/','pricing/','cash-flow/','for-consultants/'],origin=cfg.origin+cfg.basePath;
const names=locales.flatMap(l=>topics.map(t=>l+'/'+t+'index.html')).concat(locales.map(l=>l+'/help/index.html'));
const expectedSitemap=new Set(names.map(n=>origin+n.slice(0,-'index.html'.length)));
let ids=0,anchors=0,internal=0,chapterCount=0,alternates=0;
A.equal(pages.length,15,'15 existing thematic SEO records unchanged');
A.equal(Object.keys(outputs).length,17,'15 pages, CSS and sitemap');
A.equal(helpPages(cfg).length,3);
for(const name of names){
 const locale=name.split('/')[0],source=fs.readFileSync(path.join(root,name),'utf8');
 const canonical=origin+name.slice(0,-'index.html'.length);
 A.ok(source.includes('<html lang="'+locale+'">'),'Wrong html language: '+name);
 A.ok(source.includes('<meta name="robots" content="index,follow">'),'Non-indexable page: '+name);
 A.ok(source.includes('<link rel="canonical" href="'+canonical+'">'),'Wrong canonical '+name);
 A.equal((source.match(/rel="canonical"/g)||[]).length,1,'Duplicate canonical: '+name);
 for(const lang of locales){
  const sameTopic=name.slice(locale.length+1,-'index.html'.length);
  A.ok(source.includes('<link rel="alternate" hreflang="'+lang+'" href="'+origin+lang+'/'+sameTopic+'">'),'Missing reciprocal alternate '+name+' '+lang);
 }
 alternates+=3;
 const foundIds=[...source.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]),foundAnchors=[...source.matchAll(/href="#([^"]+)"/g)].map(m=>m[1]);
 A.equal(foundIds.length,new Set(foundIds).size,'Repeated fragment ID: '+name);
 for(const hash of foundAnchors)A.ok(foundIds.includes(hash),'Broken fragment '+hash+' in '+name);
 ids+=foundIds.length;anchors+=foundAnchors.length;
 if(name.includes('/help/'))for(let n=1;n<=17;n++){A.equal(foundIds.filter(x=>x==='h'+String(n).padStart(2,'0')).length,1,'Missing H chapter '+n);chapterCount++;}
 for(const m of source.matchAll(/\bhref="([^"]+)"/g)){
  const href=m[1];if(!href.startsWith(origin)&&!href.startsWith(cfg.basePath))continue;
  const rel=href.replace(origin,'').replace(cfg.basePath,'').split(/[?#]/)[0];
  if(!rel)continue;
  A.ok(!rel.split('/').includes('..'),'Traversal in page link '+name);
  const target=rel.endsWith('/')?rel+'index.html':rel;
  A.ok(fs.existsSync(path.join(root,target)),'Broken in-repo URL '+name+' → '+href);
  internal++;
 }
}
const xml=outputs['sitemap.xml'];
A.equal((xml.match(/<url>/g)||[]).length,18,'18 published URL entries');
A.equal((xml.match(/<xhtml:link /g)||[]).length,54,'54 reciprocal sitemap alternates');
const entries=[...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m=>m[1]);
A.equal(new Set(entries).size,18,'No duplicated sitemap URL');
A.deepEqual(new Set(entries),expectedSitemap,'Exact 18 indexable pages only');
A.ok(!xml.includes('<loc>'+origin+'Marketing_calc.HTML'),'Do not broaden sitemap with unrelated pages');
A.equal(chapterCount,51);
console.log('HELP_SEO_INDEX_QA_GREEN',JSON.stringify({pages:18,seo:15,help:3,chapters:chapterCount,alternates,ids,anchors,internalLinks:internal,sitemapUrls:entries.length,indexable:18,brokenLinks:0}));
