'use strict';
const {test}=require('node:test'),A=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{execFileSync}=require('node:child_process'),{stripReturn}=require('./helpers/return-contract.cjs');
const root=path.resolve(__dirname,'..'),base='5cd1e5e1bfb1b15087a29b1806424aa91dee2f12',before=f=>execFileSync('git',['show',base+':'+f],{cwd:root,maxBuffer:8*1024*1024,encoding:'utf8'});
test('All existing application files stay exact outside the five authorised presentation changes',()=>{
 const files=execFileSync('git',['ls-tree','--name-only',base],{cwd:root,encoding:'utf8'}).trim().split('\n').filter(f=>/\.(js|css|html)$/i.test(f)||f==='CALCULATOR_LICENSE.md');A.ok(files.includes('portfolio_v2_engine.js')&&files.includes('Marketing_calc.HTML')&&files.includes('nomad360_fx.js'));
 // The later owner-approved consulting B2B copy touches only these presentation files;
 // tests/nomad360_marketing_scope.test.cjs guards their unchanged non-B2B behavior.
 const laterApprovedMarketing=new Set(['nomad360_header.js','nomad360_locale_core.js','nomad360_calculator_ui.css']);
 for(const file of files)if(!laterApprovedMarketing.has(file))A.equal(stripReturn(file,fs.readFileSync(path.join(root,file),'utf8')),before(file),file);
 const published=execFileSync('git',['ls-tree','-r','--name-only',base],{cwd:root,encoding:'utf8'}).trim().split('\n').filter(f=>/^(en\/|license\/|assets\/nomad360-seo\.css$|scripts\/seo\/(build\.py|pages\.json|hero_banner\.css)$)/.test(f));for(const file of published)A.deepEqual(fs.readFileSync(path.join(root,file)),execFileSync('git',['show',base+':'+file],{cwd:root}),file);
 A.deepEqual(fs.readFileSync(path.join(root,'nomad360_wolf_open_circle.png')),execFileSync('git',['show',base+':nomad360_wolf_open_circle.png'],{cwd:root,maxBuffer:4*1024*1024}));
});
test('Every established EN RU KK message retains its accepted meaning',()=>{
 const boot=code=>{const w={};new Function('window','document',code)(w,{readyState:'loading',addEventListener(){}});return w.Nomad360LocaleCore;};const old=boot(before('nomad360_locale_core.js')),now=boot(fs.readFileSync(path.join(root,'nomad360_locale_core.js'),'utf8'));
 for(const key of old.keys())if(key!=='interface.header.embedB2BTitle')for(const language of ['en','ru','kk'])A.equal(now.t(key,language),old.t(key,language),key+' '+language);
});
function opaqueWhiteIcon(png,size){
 A.equal(png.subarray(0,8).toString('hex'),'89504e470d0a1a0a');A.equal(png.readUInt32BE(16),size);A.equal(png.readUInt32BE(20),size);A.equal(png[24],8);A.equal(png[25],2,'RGB: no transparent icon pixels');
 const chunks=[];for(let n=8;n<png.length;){const length=png.readUInt32BE(n),type=png.subarray(n+4,n+8).toString();if(type==='IDAT')chunks.push(png.subarray(n+8,n+8+length));n+=12+length;}
 const data=require('node:zlib').inflateSync(Buffer.concat(chunks)),pixels=Buffer.alloc(size*size*3),stride=size*3;
 const paeth=(a,b,c)=>{const p=a+b-c,pa=Math.abs(p-a),pb=Math.abs(p-b),pc=Math.abs(p-c);return pa<=pb&&pa<=pc?a:pb<=pc?b:c;};
 for(let y=0;y<size;y++){const filter=data[y*(stride+1)];A.ok(filter<=4);for(let x=0;x<stride;x++){const i=y*stride+x,a=x>=3?pixels[i-3]:0,b=y?pixels[i-stride]:0,c=y&&x>=3?pixels[i-stride-3]:0;pixels[i]=(data[y*(stride+1)+1+x]+[0,a,b,Math.floor((a+b)/2),paeth(a,b,c)][filter])&255;}}
 for(const [x,y] of [[0,0],[size-1,0],[0,size-1],[size-1,size-1],[Math.floor(size/2),0]])A.deepEqual([...pixels.subarray((y*size+x)*3,(y*size+x)*3+3)],[255,255,255]);
 let dark=0,orange=0;for(let n=0;n<pixels.length;n+=3){if(pixels[n]<70&&pixels[n+1]<110&&pixels[n+2]>40)dark++;if(pixels[n]>140&&pixels[n+1]<150&&pixels[n+2]<120)orange++;}A.ok(dark>size*size*.05,'Logo is present');if(size>=48)A.ok(orange>0,'Orange logo mark is preserved');
}
test('Manifest and Apple touch icon use opaque white logo assets; favicon is a real multi-size ICO',()=>{
 const manifest=JSON.parse(fs.readFileSync(path.join(root,'nomad360.webmanifest'),'utf8'));A.equal(manifest.name,'Nomad360 lite');A.equal(manifest.start_url,'/shelter-partner-directory/Marketing_calc.HTML');A.equal(manifest.id,manifest.start_url);A.equal(manifest.scope,'/shelter-partner-directory/');A.equal(manifest.display,'browser');A.equal(manifest.background_color,'#ffffff');
 A.deepEqual(manifest.icons.map(i=>i.sizes),['192x192','512x512']);for(const item of manifest.icons){A.equal(item.type,'image/png');A.equal(item.purpose,'any');opaqueWhiteIcon(fs.readFileSync(path.join(root,item.src.replace('/shelter-partner-directory/',''))),Number(item.sizes.split('x')[0]));}
 opaqueWhiteIcon(fs.readFileSync(path.join(root,'assets/nomad360-icons/icon-180.png')),180);
 const ico=fs.readFileSync(path.join(root,'assets/nomad360-icons/nomad360.ico'));A.equal(ico.readUInt16LE(0),0);A.equal(ico.readUInt16LE(2),1);A.equal(ico.readUInt16LE(4),7);
 const sizes=[];for(let n=0;n<7;n++){const at=6+n*16,size=ico[at]||256,length=ico.readUInt32LE(at+8),offset=ico.readUInt32LE(at+12);A.equal(ico[at+1]||256,size);sizes.push(size);opaqueWhiteIcon(ico.subarray(offset,offset+length),size);}A.deepEqual(sizes,[16,24,32,48,64,128,256]);
});
