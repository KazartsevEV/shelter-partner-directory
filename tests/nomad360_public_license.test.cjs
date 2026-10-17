'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {execFileSync}=require('node:child_process');
const fs=require('node:fs');
const path=require('node:path');

const root=path.resolve(__dirname,'..');
const read=filename=>fs.readFileSync(path.join(root,filename),'utf8');
const origin='https://kazartsevev.github.io/shelter-partner-directory/';
const pages={ru:'license/index.html',en:'license/en/index.html',kk:'license/kk/index.html'};

test('All public legal pages are identical to the authoritative complete v2.4 source',()=>{
 const output=execFileSync('python3',['scripts/legal/build_license.py','--check'],{cwd:root,encoding:'utf8'});
 assert.match(output,/complete EN\/RU\/KK 2\.4 editions verified/);
 assert.match(read('CALCULATOR_LICENSE.md'),/\*\*Version:\*\* 2\.4 · 17 October 2026/);
 for(const [lang,file] of Object.entries(pages)){
  const page=read(file);
  assert.match(page,new RegExp('<html lang="'+lang+'">'));
  assert.match(page,/<article class="legal-article" id="full-license"/);
  assert.equal((page.match(/<h2 id="section-\d+">/g)||[]).length,11,lang+': legal sections 1-11');
  assert.match(page,/nomad260393@gmail\.com/);
  assert.doesNotMatch(page,/section-12|Kazakhstan company|компании Казахстана|Қазақстандағы компанияға/,lang+': removed section 12 and planned Kazakhstan company');
  assert.match(page,/section-11/,lang+': final active section is 11');
  assert.match(page,/Евгений Казарцев|Evgenii Kazartsev/);
  assert.ok(page.includes('href="'+origin+'Marketing_calc.HTML?lang='+lang+'"'),lang+': back to calculator');
  const canonical=lang==='ru'?origin+'license/':origin+'license/'+lang+'/';
  assert.ok(page.includes('<link rel="canonical" href="'+canonical+'">'));
  for(const suffix of ['license/','license/en/','license/kk/']){
   assert.ok(page.includes('href="'+origin+suffix+'"'),lang+': cross-language legal link '+suffix);
  }
  assert.doesNotMatch(page,/href="https:\/\/github\.com\//,lang+': never navigate into GitHub for licensing');
 }
});

test('Published footer respects the full unmodified-edition license on RU EN KK',()=>{
 const header=read('nomad360_header.js');
 const locale=read('nomad360_locale_core.js');
 const oldRu='Использование, копирование, изменение и встраивание калькулятора разрешены';
 const oldEn='You may use, copy, modify and embed the calculator';
 const oldKk='Қолданыстағы лицензия бойынша калькуляторды пайдалану, көшіру, өзгерту';
 for(const file of [header,locale]){
  for(const old of [oldRu,oldEn,oldKk])assert.ok(!file.includes(old),'Stale permissive license copy remains');
  for(const keyword of ['licenseCopy','соглашению','written agreement','келісім'])assert.ok(file.includes(keyword),'Missing approved license summary: '+keyword);
 }
 assert.ok(header.includes("language()==='en'?'en/':language()==='kk'?'kk/':''"),'Footer must use language-specific legal URL');
 assert.ok(!header.includes('href="https://github.com/KazartsevEV/shelter-partner-directory/blob/main/CALCULATOR_LICENSE.md"'));
 for(const page of ['en/index.html','en/business-idea/index.html','en/pricing/index.html','en/cash-flow/index.html','en/for-consultants/index.html'])
  assert.match(read(page),/href="https:\/\/kazartsevev\.github\.io\/shelter-partner-directory\/license\/en\/"/,page);
});
