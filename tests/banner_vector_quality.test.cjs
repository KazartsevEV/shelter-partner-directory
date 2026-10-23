'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {createHash}=require('node:crypto');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p));
const vector=read('assets/nomad360-banners/about-moonlight-horizontal-only-3200x768.svg');
test('About uses native scalable contours and gradients, with no raster or blur substitute',()=>{
 const svg=vector.toString();
 assert.doesNotMatch(svg,/<(?:image|foreignObject|filter|text)\b|data:image\/|https?:\/\/(?!www\.w3\.org)/i);
 assert.match(svg,/viewBox="0 0 3200 768"/);
 assert.ok((svg.match(/<path\b/g)||[]).length>10000,'Detailed contours must survive optimisation');
 assert.match(svg,/<radialGradient\b/,'The moon must have a native smooth light gradient');
 assert.match(svg,/<circle\b/,'The moon rim must remain an exact smooth circle');
 assert.match(svg,/<linearGradient\b/,'Sky and edge transitions must be continuous gradients');
 assert.ok(vector.length<5_000_000,'Do not ship the 10–17 MB intermediate traces');
});
test('Approved original landscape is preserved for reproducible vector builds',()=>{
 const source=read('assets/nomad360-banners/about-bozzhyra-desktop-extended-20261019.webp');
 assert.equal(createHash('sha256').update(source).digest('hex'),'b3992f48ea2535466f8372bbc52b14817e02d96246c9e405c87d4f44995fca9f');
});
