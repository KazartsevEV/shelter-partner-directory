'use strict';
const fs=require('node:fs'),path=require('node:path'),zlib=require('node:zlib'),A=require('node:assert/strict'),{sha}=require('./runtime-inventory.cjs');
function summarize(input,out){
 const inventory=JSON.parse(fs.readFileSync(path.join(input,'inventory.json'))),browser=JSON.parse(fs.readFileSync(path.join(input,'browser.json')));
 A.equal(browser.baseRevision,inventory.baseRevision);A.equal(browser.method.quick,false,'Smoke output is not a full baseline');A.deepEqual(browser.failures,[]);
 for(const file of inventory.files)A.equal(browser.sourceHashes[file.file],file.sha256,file.file+' static/runtime fingerprints');
 A.equal(browser.loads.length,18);A.equal(browser.cases.filter(x=>x.kind==='restore-standalone').length,18);
 A.equal(browser.cases.filter(x=>x.kind.startsWith('autonomous-')).length,60);
 const median=values=>{const a=[...values].sort((a,b)=>a-b);return a.length%2?a[(a.length-1)/2]:(a[a.length/2-1]+a[a.length/2])/2;};
 const range=values=>({min:Math.min(...values),median:median(values),max:Math.max(...values)});
 const rows=browser.cases.filter(x=>x.metrics),repeat=browser.cases.filter(x=>x.samples);
 const root=path.resolve(__dirname,'../..');
 const contracts=['tests/fixtures/v1-engine/accepted-main.json','tests/fixtures/v1-engine/extraction.json','tests/fixtures/sales-tax-7b/vat-inputs.json','docs/reviews/sales-tax-7b/baseline/engine-results.json.gz','tests/fixtures/tax-draft-storage/extraction.json','tests/nomad360_price_export_browser.test.cjs','tests/sales_tax_7b5_v1_pdf_browser.cjs'].map(file=>{const bytes=fs.readFileSync(path.join(root,file)),frozen=require('node:child_process').execFileSync('git',['show',inventory.baseRevision+':'+file],{cwd:root,maxBuffer:20*1024*1024});A.deepEqual(bytes,frozen,'Protected numeric/export contract '+file);return {file,bytes:bytes.length,sha256:sha(bytes)};});
 const summary={baseRevision:inventory.baseRevision,sourceSummary:inventory.summary,files:inventory.files,additionalFingerprints:inventory.additionalFingerprints,contracts,
  runtime:{loads:browser.loads.length,caseRows:browser.cases.length,metricSamples:rows.length+repeat.reduce((n,x)=>n+x.samples.length,0),labReadyWallMs:range(browser.loads.map(x=>x.readyWallMs)),domContentLoadedMs:range(browser.loads.map(x=>x.navigation.domContentLoadedMs)),initialResourceBytes:range(browser.loads.map(x=>x.navigation.encodedBytes+x.resources.reduce((s,r)=>s+r.encodedBytes,0))),heapUsedBytes:range(rows.map(x=>x.metrics.heapUsedBytes)),jsEventListeners:range(rows.map(x=>x.metrics.jsEventListeners)),domNodes:range(rows.map(x=>x.dom.nodes)),repeatedRender:repeat.map(x=>({language:x.language,width:x.width,listeners:x.samples.map(s=>s.jsEventListeners),heapBytes:x.samples.map(s=>s.heapUsedBytes)})),selectorsObserved:browser.selectors.observed.length,selectorsNotObserved:browser.selectors.notObserved.length,selectorsUnsupported:browser.selectors.unsupported.length,coverageSources:browser.coverage.length,coverageMissingSources:browser.missingCoverageSources.length},
  duplicateCssGroups:inventory.exactDuplicateCssGroups,toolVersions:{...inventory.toolVersions,...browser.toolVersions},method:browser.method,
  acceptedForDeletion:[],limitations:inventory.limitations};
 fs.mkdirSync(out,{recursive:true});
 for(const [name,data] of [['inventory',inventory],['browser',browser]])fs.writeFileSync(path.join(out,'runtime-'+name+'.json.gz'),zlib.gzipSync(JSON.stringify(data),{level:9}));
 const packages=Object.fromEntries(['runtime-inventory.json.gz','runtime-browser.json.gz'].map(name=>{const bytes=fs.readFileSync(path.join(out,name));return [name,{bytes:bytes.length,sha256:sha(bytes)}];}));
 fs.writeFileSync(path.join(out,'summary.json'),JSON.stringify({...summary,packages},null,2)+'\n');
 const cell=value=>String(value).replace(/\|/g,'\\|').replace(/\n/g,' ');
 const table=(headers,rows)=>[headers.map(cell).join(' | '),headers.map(()=>'---').join(' | '),...rows.map(row=>row.map(cell).join(' | '))].map(line=>'| '+line+' |').join('\n');
 const text=[
  '# Runtime audit: generated index',
  'Frozen application revision: `'+summary.baseRevision+'`. This index contains observations, not permission to remove code.',
  '## Source census',table(['Metric','Count'],Object.entries(summary.sourceSummary)),
  '## Largest application files',table(['File','Bytes','Gzip bytes','Brotli bytes','Lines'],[...inventory.files].sort((a,b)=>b.bytes-a.bytes).slice(0,18).map(f=>[f.file,f.bytes,f.gzipBytes,f.brotliBytes,f.lines])),
  'These sizes are individual source-file measurements, not a claim that all files load together. Generated standalone and vendor fingerprints are separate in summary.json.',
  '## Browser baseline',`${summary.runtime.loads} load cases; ${summary.runtime.caseRows} case rows; ${summary.runtime.metricSamples} heap/listener samples. ${summary.runtime.selectorsObserved} selectors observed; ${summary.runtime.selectorsNotObserved} not observed; ${summary.runtime.selectorsUnsupported} not supported by the DOM query probe.`,table(['Metric','Min','Median','Max'],Object.entries(summary.runtime).filter(([,value])=>value&&typeof value==='object'&&!Array.isArray(value)).map(([name,value])=>[name,value.min,value.median,value.max])),
  'Measurements use local HTTP, blocked external resources, the pinned local utility CSS, DevTools profiling and GC before heap samples. This is a lab comparison protocol, not production Core Web Vitals or a timing SLA.',
  '## Duplicate CSS candidates',table(['File','Selectors','Occurrences','Cascade context'],inventory.exactDuplicateCssGroups.map(g=>[g.file,g.selectors.join(', '),g.occurrences.map(x=>x.line+'@'+x.start).join('; '),g.context.join(' → ')||'unlayered'])),
  'Identical rules may restore values after intervening overrides. Source generator, all scenarios and computed styles must be checked before deletion. Offsets disambiguate repeated minified rules on the same line.',
  '## Repeated navigation',table(['Language','Width','JSEventListeners after each of five round trips'],summary.runtime.repeatedRender.map(x=>[x.language,x.width,x.listeners.join(' → ')])),
  '## Machine-readable maps',
  '- [Summary and fingerprints](summary.json).',
  '- [Full AST/HTML/CSS inventory](runtime-inventory.json.gz): files, resources/dependency edges, function/call/global sites, handlers, observers/timers, inline style writes, selectors, generated DOM, cascade layers, overrides and exact duplicates.',
  '- [Full browser baseline](runtime-browser.json.gz): case metrics, runtime listener descriptors, load resources, numeric leaves, restore checks, fresh standalone manifest, observed selectors and coverage.',
  'No code is approved for removal by this report. Dynamic or unobserved cases remain review-required.'
 ].join('\n\n')+'\n';fs.writeFileSync(path.join(out,'INDEX.md'),text);console.log('RUNTIME_SUMMARY_GREEN',JSON.stringify({cases:summary.runtime.caseRows,loads:summary.runtime.loads,metricSamples:summary.runtime.metricSamples,selectorsObserved:summary.runtime.selectorsObserved,selectorsNotObserved:summary.runtime.selectorsNotObserved}));return summary;
}
if(require.main===module){if(process.argv.length!==4)throw Error('Usage: node scripts/audit/runtime-summary.cjs input-directory output-directory');summarize(process.argv[2],process.argv[3]);}
module.exports={summarize};
