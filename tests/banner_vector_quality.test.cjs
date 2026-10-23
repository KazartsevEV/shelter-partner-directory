'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {createHash}=require('node:crypto');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p));
const scene=read('assets/nomad360-banners/about-moonlight-horizontal-only-3200x768.svg');
const source=read('assets/nomad360-banners/about-bozzhyra-desktop-extended-20261019.webp');
test('About preserves the original photograph exactly once inside the SVG composition',()=>{
 const svg=scene.toString();
 const images=[...svg.matchAll(/href="data:image\/webp;base64,([^"\s]+)"/g)];
 assert.equal(images.length,1,'Reuse a single embedded original for all scenic extensions');
 assert.deepEqual(Buffer.from(images[0][1],'base64'),source,'No tracing, quantisation or recompression');
 assert.doesNotMatch(svg,/<(?:path|foreignObject|filter|text|script)\b/i,'No trace, blur or rasterised copy');
 assert.match(svg,/viewBox="0 0 3200 768"/);
 assert.match(svg,/width="1536" height="768" preserveAspectRatio="xMidYMid meet"/);
 assert.match(svg,/<linearGradient\b/,'Keep a natural transition into brand navy');
 assert.equal((svg.match(/<use\b/g)||[]).length,5,'Retain central scene and the existing edge extensions');
 assert.ok(scene.length<160_000,'Avoid duplicate originals and the multi-megabyte trace');
});
test('Approved original landscape is unchanged',()=>{
 assert.equal(createHash('sha256').update(source).digest('hex'),'b3992f48ea2535466f8372bbc52b14817e02d96246c9e405c87d4f44995fca9f');
});
