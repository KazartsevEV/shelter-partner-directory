'use strict';
const {test}=require('node:test'),A=require('node:assert/strict');
const C=require('./helpers/contrast.cjs');
test('WCAG reference contrast and alpha composition',()=>{
 A.equal(C.ratio([0,0,0],[255,255,255]),21);
 A.equal(C.ratio([255,255,255],[255,255,255]),1);
 A.deepEqual(C.over([255,255,255,0.5],[0,0,0,1]),[127.5,127.5,127.5,1]);
 A.ok(Math.abs(C.ratio([127.5,127.5,127.5],[255,255,255])-3.976653)<0.00001);
});
test('same dark label fails when translucent indigo is painted over navy',()=>{
 const text=C.rgba('rgb(51, 65, 85)'),card=C.rgba('rgba(238, 242, 255, 0.4)');
 const light=C.over(card,[255,255,255,1]),dark=C.over(card,[22,55,90,1]);
 A.ok(C.ratio(text,light)>9);A.ok(C.ratio(text,dark)<3);
 A.ok(C.ratio(text,[255,255,255])>10);
});
test('ancestor group opacity affects both foreground and background',()=>{
 const styles=[{color:'rgb(255, 255, 255)',backgroundColor:'rgba(0, 0, 0, 0)',backgroundImage:'none',opacity:'1'},
  {backgroundColor:'rgb(0, 0, 0)',backgroundImage:'none',opacity:'0.5'}];
 const parent={parentElement:null},child={parentElement:parent};
 global.getComputedStyle=el=>styles[el===child?0:1];
 try{const p=C.painted(child);A.deepEqual(p.background,[127.5,127.5,127.5,1]);A.deepEqual(p.foreground,[255,255,255,1]);A.ok(p.ratio<4.5);}
 finally{delete global.getComputedStyle;}
});
